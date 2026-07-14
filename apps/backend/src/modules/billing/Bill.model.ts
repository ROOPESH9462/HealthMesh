import mongoose, { Schema, Document } from 'mongoose';
import { IBill, PaymentStatus } from '@healthcare/shared-types';

export interface IBillDocument extends Omit<IBill, 'id' | 'patientId' | 'appointmentId' | 'prescriptionId'>, Document {
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;
}

const BillSchema = new Schema<IBillDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      index: true
    },
    items: [
      {
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 }
      }
    ],
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    insuranceCoveredAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    netPayableAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
      index: true
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
        if (json.appointmentId) json.appointmentId = json.appointmentId.toString();
        if (json.prescriptionId) json.prescriptionId = json.prescriptionId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const BillModel = mongoose.model<IBillDocument>('Bill', BillSchema);

export default BillModel;
