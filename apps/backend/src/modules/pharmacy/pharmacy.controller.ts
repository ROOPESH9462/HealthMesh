import { Request, Response, NextFunction } from 'express';
import PharmacyService from './pharmacy.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';
import { mapMedicineToDTO } from '@healthcare/api-contracts';

export class PharmacyController {
  private pharmacyService = new PharmacyService();

  getMedicines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const name = req.query.name as string;

      const { data, pagination } = await this.pharmacyService.getMedicines({
        page,
        limit,
        name,
      });

      const mapped = data.map((item: any) => mapMedicineToDTO(item));
      res.status(200).json(formatSuccessResponse('Pharmacy catalog retrieved successfully', mapped, pagination));
    } catch (error) {
      next(error);
    }
  };

  getMedicineById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const medicine = await this.pharmacyService.getMedicineById(id);
      const dto = mapMedicineToDTO(medicine as any);
      res.status(200).json(formatSuccessResponse('Medicine details retrieved successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  createMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicine = await this.pharmacyService.createMedicine(req.body);
      const dto = mapMedicineToDTO(medicine as any);
      res.status(201).json(formatSuccessResponse('Medicine registered successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  addInventoryBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const batch = await this.pharmacyService.addInventoryBatch(req.body);
      res.status(201).json(formatSuccessResponse('Inventory batch successfully recorded', batch));
    } catch (error) {
      next(error);
    }
  };
}
export default PharmacyController;
