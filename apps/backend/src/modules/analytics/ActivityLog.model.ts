import mongoose, { Schema, Document } from 'mongoose';
import { IActivityLog, UserRole } from '@healthcare/shared-types';

export interface IActivityLogDocument extends Omit<IActivityLog, 'id' | 'userId'>, Document {
  userId?: mongoose.Types.ObjectId;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    userRole: {
      type: String,
      enum: Object.values(UserRole)
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entity: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entityId: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    }
  },
  {
    timestamps: false // We use custom timestamp field
  }
);

// We keep activity logs for 90 days before cleaning up to save storage space in Atlas free tier
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const ActivityLogModel = mongoose.model<IActivityLogDocument>('ActivityLog', ActivityLogSchema);

export default ActivityLogModel;
