import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface IConsultation {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  notes?: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConsultationDocument extends Omit<IConsultation, 'id' | 'appointmentId' | 'doctorId' | 'patientId'>, Document {
  appointmentId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true }
});

const ConsultationSchema = new Schema<IConsultationDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      unique: true,
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true
    },
    endTime: {
      type: Date
    },
    durationSeconds: {
      type: Number
    },
    notes: {
      type: String,
      trim: true
    },
    messages: {
      type: [ChatMessageSchema],
      default: []
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
        json.doctorId = json.doctorId.toString();
        json.patientId = json.patientId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const ConsultationModel = mongoose.model<IConsultationDocument>('Consultation', ConsultationSchema);

export default ConsultationModel;
