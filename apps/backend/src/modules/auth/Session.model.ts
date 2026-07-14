import mongoose, { Schema, Document } from 'mongoose';
import { ISession } from '@healthcare/shared-types';

export interface ISessionDocument extends Omit<ISession, 'id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isValid: {
      type: Boolean,
      default: true,
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
        json.userId = json.userId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

// Auto-expire sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = mongoose.model<ISessionDocument>('Session', SessionSchema);

export default SessionModel;
