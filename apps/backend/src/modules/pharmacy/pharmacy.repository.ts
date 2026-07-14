import MedicineModel, { IMedicineDocument } from './Medicine.model';
import InventoryModel, { IInventoryDocument } from './Inventory.model';
import { IPaginationMeta } from '@healthcare/shared-utils';
import { ClientSession } from 'mongoose';

export class PharmacyRepository {
  /**
   * Register a new medicine item
   */
  async createMedicine(data: any, session?: ClientSession): Promise<IMedicineDocument> {
    const docs = await MedicineModel.create([data], { session });
    return docs[0];
  }

  /**
   * Find medicine by ID
   */
  async findMedicineById(id: string): Promise<IMedicineDocument | null> {
    return MedicineModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  /**
   * Find medicine by barcode or barcode lookup
   */
  async findMedicineByBarcode(barcode: string): Promise<IMedicineDocument | null> {
    return MedicineModel.findOne({ barcode, isDeleted: false }).exec();
  }

  /**
   * List medicine items with filters, sorting, and pagination
   */
  async listMedicines(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = { isDeleted: false, ...filter };

    if (filter.name) {
      mongoFilter.name = new RegExp(filter.name, 'i');
    }

    const total = await MedicineModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await MedicineModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .exec();

    const data = results.map((doc) => doc.toJSON());

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  /**
   * Update stock count directly (e.g. on manual override or prescription fulfillment)
   */
  async updateMedicineStock(
    id: string,
    stockCount: number,
    session?: ClientSession
  ): Promise<IMedicineDocument | null> {
    return MedicineModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { stockCount },
      { new: true, session }
    ).exec();
  }

  /**
   * Soft delete medicine
   */
  async deleteMedicine(id: string, userId: string): Promise<IMedicineDocument | null> {
    return MedicineModel.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
      { new: true }
    ).exec();
  }

  /**
   * Create Inventory batch entry
   */
  async createInventory(data: any, session?: ClientSession): Promise<IInventoryDocument> {
    const docs = await InventoryModel.create([data], { session });
    return docs[0];
  }

  /**
   * List inventory batches for a specific medicine
   */
  async listInventoryByMedicine(medicineId: string): Promise<IInventoryDocument[]> {
    return InventoryModel.find({ medicineId }).sort({ expiryDate: 1 }).exec();
  }
}
export default PharmacyRepository;
