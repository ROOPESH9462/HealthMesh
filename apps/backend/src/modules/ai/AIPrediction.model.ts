import mongoose, { Schema, Document } from 'mongoose';

export interface IAIPrediction {
  id: string;
  patientId: string;
  documentId?: string;
  modelName: string;
  modelVersion: string;
  confidence: number;
  executionTimeMs: number;
  prediction: string;
  rawOutput: Record<string, any>;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIPredictionDocument extends Omit<IAIPrediction, 'id' | 'patientId' | 'documentId' | 'requestedBy'>, Document {
  patientId: mongoose.Types.ObjectId;
  documentId?: mongoose.Types.ObjectId;
  requestedBy?: mongoose.Types.ObjectId;
}

const AIPredictionSchema = new Schema<IAIPredictionDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalDocument',
      index: true
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required']
    },
    modelVersion: {
      type: String,
      required: [true, 'Model version is required']
    },
    confidence: {
      type: Number,
      required: true
    },
    executionTimeMs: {
      type: Number,
      required: true
    },
    prediction: {
      type: String,
      required: true
    },
    rawOutput: {
      type: Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      required: true
    },
    requestedBy: {
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
        json.patientId = json.patientId.toString();
        if (json.documentId) json.documentId = json.documentId.toString();
        if (json.requestedBy) json.requestedBy = json.requestedBy.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const AIPredictionModel = mongoose.model<IAIPredictionDocument>('AIPrediction', AIPredictionSchema);

export default AIPredictionModel;
