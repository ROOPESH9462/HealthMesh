import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessageDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  conversationId: string; // Grouping session key
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    title: string;
    url?: string;
  }>;
  confidenceScore?: number;
  timestamp: Date;
}

const ChatMessageSchema = new Schema<IChatMessageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    citations: [
      {
        title: { type: String, required: true },
        url: { type: String }
      }
    ],
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Auto-delete chat history logs after 60 days
ChatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 5184000 });

const ChatMessageModel = mongoose.model<IChatMessageDocument>('ChatMessage', ChatMessageSchema);

export default ChatMessageModel;
