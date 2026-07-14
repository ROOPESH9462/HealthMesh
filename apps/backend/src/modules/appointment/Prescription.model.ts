import mongoose, { Schema, Document } from 'mongoose';
import { IPrescription } from '@healthcare/shared-types';

export interface IPrescriptionDocument extends Omit<IPrescription, 'id' | 'appointmentId' | 'patientId' | 'doctorId' | 'medicines'>, Document {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  medicines: Array<{
    medicineId: mongoose.Types.ObjectId;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      unique: true, // One prescription per appointment
      index: true
    },
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
    medicines: [
      {
        medicineId: {
          type: Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true
        },
        medicineName: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true }, // e.g. "1-0-1"
        frequency: { type: String, required: true, trim: true }, // e.g. "After food"
        duration: { type: String, required: true, trim: true } // e.g. "5 days"
      }
    ],
    instructions: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    isFilled: {
      type: Boolean,
      default: false,
      required: true
    },
    issuedDate: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const json = ret as any;
        json.id = json._id.toString();
        json.appointmentId = json.appointmentId.toString();
        json.patientId = json.patientId.toString();
        json.doctorId = json.doctorId.toString();
        if (json.medicines) {
          json.medicines = json.medicines.map((m: any) => {
            m.id = m._id ? m._id.toString() : m.id;
            m.medicineId = m.medicineId.toString();
            delete m._id;
            return m;
          });
        }
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const PrescriptionModel = mongoose.model<IPrescriptionDocument>('Prescription', PrescriptionSchema);

export default PrescriptionModel;
