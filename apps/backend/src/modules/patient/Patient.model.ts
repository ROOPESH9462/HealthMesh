import mongoose, { Schema, Document } from 'mongoose';
import { IPatient } from '@healthcare/shared-types';

export interface IPatientDocument extends Omit<IPatient, 'id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
}

const PatientSchema = new Schema<IPatientDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: [true, 'Gender specification is required']
    },
    bloodGroup: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true }
    },
    allergies: {
      type: [String],
      default: []
    },
    medicalConditions: {
      type: [String],
      default: []
    },
    // Soft Delete history preservation
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const json = ret as any;
        json.id = json._id.toString();
        json.userId = json.userId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

// Indexes
PatientSchema.index({ bloodGroup: 1 });

const PatientModel = mongoose.model<IPatientDocument>('Patient', PatientSchema);

export default PatientModel;
