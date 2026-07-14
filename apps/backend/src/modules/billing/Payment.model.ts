import mongoose, { Schema, Document } from 'mongoose';
import { IPayment, PaymentStatus } from '@healthcare/shared-types';

export interface IPaymentDocument extends Omit<IPayment, 'id' | 'billId'>, Document {
  billId: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    billId: {
      type: Schema.Types.ObjectId,
      ref: 'Bill',
      required: [true, 'Bill reference is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['STRIPE', 'UPI', 'CASH'],
      required: true
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      index: true
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
        json.billId = json.billId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const PaymentModel = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);

export default PaymentModel;
