import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureFlagDocument extends Document {
  key: string;
  isEnabled: boolean;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlagDocument>(
  {
    key: {
      type: String,
      required: [true, 'Feature flag key is required'],
      unique: true,
      trim: true,
      index: true
    },
    isEnabled: {
      type: Boolean,
      default: true,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const FeatureFlagModel = mongoose.model<IFeatureFlagDocument>('FeatureFlag', FeatureFlagSchema);

export default FeatureFlagModel;
