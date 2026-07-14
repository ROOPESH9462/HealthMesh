import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryDocument extends Document {
  medicineId: mongoose.Types.ObjectId;
  batchNumber: string;
  quantity: number;
  location: string; // e.g. "Shelf A1"
  supplierName: string;
  expiryDate: Date;
  status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    location: {
      type: String,
      required: true,
      trim: true // e.g. "Aisle 3, Shelf B"
    },
    supplierName: {
      type: String,
      required: true,
      trim: true
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['IN_STOCK', 'OUT_OF_STOCK', 'EXPIRED'],
      default: 'IN_STOCK',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee batch uniqueness per medicine
InventorySchema.index({ medicineId: 1, batchNumber: 1 }, { unique: true });

const InventoryModel = mongoose.model<IInventoryDocument>('Inventory', InventorySchema);

export default InventoryModel;
