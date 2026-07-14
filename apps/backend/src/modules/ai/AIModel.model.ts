import mongoose, { Schema, Document } from 'mongoose';

export interface IAIModelDocument extends Document {
  name: string;
  version: string;
  trainingDate?: Date;
  datasetDetails?: string;
  metrics: Record<string, number>; // e.g., { "accuracy": 0.94, "f1": 0.93 }
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  checksum?: string; // Model file hash validation
  deploymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIModelSchema = new Schema<IAIModelDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    version: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    trainingDate: {
      type: Date
    },
    datasetDetails: {
      type: String,
      trim: true
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
      default: {}
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DEPRECATED'],
      default: 'ACTIVE',
      required: true,
      index: true
    },
    checksum: {
      type: String,
      trim: true
    },
    deploymentDate: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true
  }
);

AIModelSchema.index({ name: 1, version: 1 }, { unique: true });

const AIModelModel = mongoose.model<IAIModelDocument>('AIModel', AIModelSchema);

export default AIModelModel;
