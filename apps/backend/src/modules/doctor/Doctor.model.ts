import mongoose, { Schema, Document } from 'mongoose';
import { IDoctor } from '@healthcare/shared-types';

export interface IDoctorDocument extends Omit<IDoctor, 'id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
}

const DoctorSchema = new Schema<IDoctorDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      index: true
    },
    departmentId: {
      type: String,
      required: [true, 'Department ID is required'],
      trim: true,
      index: true
    },
    qualification: {
      type: [String],
      required: [true, 'Qualification qualifications list is required']
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative']
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative']
    },
    availableDays: {
      type: [String],
      required: [true, 'Available days of the week are required']
    },
    timeSlots: {
      type: [String],
      required: [true, 'Available time slots are required']
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
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

const DoctorModel = mongoose.model<IDoctorDocument>('Doctor', DoctorSchema);

export default DoctorModel;
