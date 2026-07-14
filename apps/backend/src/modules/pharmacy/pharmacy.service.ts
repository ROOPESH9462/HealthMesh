import PharmacyRepository from './pharmacy.repository';
import { NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { withTransaction } from '../../utils/transaction';
import logger from '../../utils/logger';

export class PharmacyService {
  private pharmacyRepo = new PharmacyRepository();

  async getMedicines(params: { page: number; limit: number; name?: string }) {
    const filter: Record<string, any> = {};
    if (params.name) {
      filter.name = params.name;
    }
    return this.pharmacyRepo.listMedicines(filter, { page: params.page, limit: params.limit });
  }

  async getMedicineById(id: string) {
    const med = await this.pharmacyRepo.findMedicineById(id);
    if (!med) {
      throw new NotFoundError('Medicine not found in catalog');
    }
    return med;
  }

  async createMedicine(data: {
    name: string;
    manufacturer: string;
    composition: string[];
    dosageForm: string;
    strength: string;
    pricePerUnit: number;
    expiryDate: string;
    lowStockThreshold?: number;
    barcode?: string;
  }) {
    if (data.barcode) {
      const existing = await this.pharmacyRepo.findMedicineByBarcode(data.barcode);
      if (existing) {
        throw new BadRequestError('Medicine with this barcode already exists');
      }
    }

    return this.pharmacyRepo.createMedicine({
      ...data,
      stockCount: 0, // initialized at 0, updated via inventory batch intakes
      expiryDate: new Date(data.expiryDate),
    });
  }

  /**
   * Log an intake inventory batch, dynamically incrementing the medicine catalog stock
   */
  async addInventoryBatch(params: {
    medicineId: string;
    batchNumber: string;
    quantity: number;
    location: string;
    supplierName: string;
    expiryDate: string;
  }) {
    return withTransaction(async (session) => {
      const medicine = await this.pharmacyRepo.findMedicineById(params.medicineId);
      if (!medicine) {
        throw new NotFoundError('Medicine not registered in catalog');
      }

      // Create inventory batch record
      const inventory = await this.pharmacyRepo.createInventory(
        {
          medicineId: params.medicineId,
          batchNumber: params.batchNumber,
          quantity: params.quantity,
          location: params.location,
          supplierName: params.supplierName,
          expiryDate: new Date(params.expiryDate),
          status: 'IN_STOCK',
        },
        session
      );

      // Increment medicine stock count
      const updatedStockCount = medicine.stockCount + params.quantity;
      await this.pharmacyRepo.updateMedicineStock(medicine.id, updatedStockCount, session);

      logger.info(`Intake batch ${params.batchNumber} logged. Incrementing ${medicine.name} stockCount by ${params.quantity}.`);
      return inventory;
    });
  }

  async deleteMedicine(id: string, userId: string) {
    const deleted = await this.pharmacyRepo.deleteMedicine(id, userId);
    if (!deleted) {
      throw new NotFoundError('Medicine not found');
    }
    return deleted;
  }
}
export default PharmacyService;
