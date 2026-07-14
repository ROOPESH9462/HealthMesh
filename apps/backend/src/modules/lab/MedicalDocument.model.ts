import mongoose, { Schema, Document } from 'mongoose';
import { IMedicalDocument, DocumentType } from '@healthcare/shared-types';

export interface IMedicalDocumentDocument extends Omit<IMedicalDocument, 'id' | 'patientId' | 'doctorId'>, Document {
  patientId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
}

const MedicalDocumentSchema = new Schema<IMedicalDocumentDocument>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
      index: true
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'Document type is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL location is required']
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    summary: {
      type: String,
      trim: true
    },
    abnormalitiesHighlighted: {
      type: [String],
      default: []
    },
    isVerifiedByDoctor: {
      type: Boolean,
      default: false,
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
        json.patientId = json.patientId.toString();
        if (json.doctorId) json.doctorId = json.doctorId.toString();
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

const MedicalDocumentModel = mongoose.model<IMedicalDocumentDocument>('MedicalDocument', MedicalDocumentSchema);

export default MedicalDocumentModel;
