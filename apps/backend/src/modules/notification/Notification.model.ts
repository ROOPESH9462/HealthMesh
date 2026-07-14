import mongoose, { Schema, Document } from 'mongoose';
import { INotification, NotificationChannel } from '@healthcare/shared-types';

export interface INotificationDocument extends Omit<INotification, 'id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    channel: {
      type: [String],
      enum: Object.values(NotificationChannel),
      default: [NotificationChannel.WEBSOCKET],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
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
        json.userId = json.userId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

// TTL index to automatically remove notifications after 30 days to optimize database size
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;
