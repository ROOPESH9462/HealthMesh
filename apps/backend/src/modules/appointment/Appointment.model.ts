import mongoose, { Schema, Document } from 'mongoose';
import { IAppointment, AppointmentStatus } from '@healthcare/shared-types';

export interface IAppointmentDocument extends Omit<IAppointment, 'id' | 'patientId' | 'doctorId'>, Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required']
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED,
      required: true,
      index: true
    },
    symptomsDescription: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    cancellationReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const json = ret as any;
        json.id = json._id.toString();
        json.patientId = json.patientId.toString();
        json.doctorId = json.doctorId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

// Crucial compound index: prevents double booking the same doctor at the same slot on the same day
// ONLY enforce this uniqueness constraint for active (Scheduled / Rescheduled) bookings.
// Note: In mongoose, unique compound index applies to all documents. To allow cancellation and re-booking of the same slot:
// We can define a partial index that only enforces uniqueness if status is SCHEDULED or RESCHEDULED.
AppointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED] }
    }
  }
);

const AppointmentModel = mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default AppointmentModel;
