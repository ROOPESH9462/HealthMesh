import mongoose, { Schema, Document } from 'mongoose';
import { IMedicine } from '@healthcare/shared-types';

export interface IMedicineDocument extends Omit<IMedicine, 'id'>, Document {
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
}

const MedicineSchema = new Schema<IMedicineDocument>(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      index: true
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true
    },
    composition: {
      type: [String],
      required: [true, 'Composition details are required'],
      default: []
    },
    dosageForm: {
      type: String,
      enum: ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'CREAM', 'OTHER'],
      required: [true, 'Dosage form is required']
    },
    strength: {
      type: String,
      required: [true, 'Strength specification is required'],
      trim: true // e.g. "500mg"
    },
    stockCount: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true
    },
    supplierName: {
      type: String,
      trim: true
    },
    supplierContact: {
      type: String,
      trim: true
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: [1, 'Low stock threshold must be at least 1'],
      default: 10
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow multiple nulls/undefined for medicines without barcodes
      index: true
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
        delete json._id;
        delete json.__v;
        return json;
      }
    }
  }
);

// Indexes
MedicineSchema.index({ name: 1 });
MedicineSchema.index({ expiryDate: 1 });

const MedicineModel = mongoose.model<IMedicineDocument>('Medicine', MedicineSchema);

export default MedicineModel;
