import { Request, Response, NextFunction } from 'express';
import PrescriptionService from './prescription.service';
import { 
  formatSuccessResponse, 
  prescriptionCreateSchema
} from '@healthcare/shared-utils';
import { mapPrescriptionToDTO } from '@healthcare/api-contracts';

export class PrescriptionController {
  private prescriptionService = new PrescriptionService();

  createPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = prescriptionCreateSchema.parse(req.body);
      const appt = await this.prescriptionService.createPrescription(validated);
      const dto = mapPrescriptionToDTO(appt as any);
      res.status(201).json(formatSuccessResponse('Prescription issued successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  getPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const patientId = req.query.patientId as string;

      const { data, pagination } = await this.prescriptionService.getPrescriptions({
        userId: user.id,
        role: user.role,
        page,
        limit,
        patientId,
      });

      const mapped = data.map((item: any) => mapPrescriptionToDTO(item));
      res.status(200).json(formatSuccessResponse('Prescriptions log retrieved successfully', mapped, pagination));
    } catch (error) {
      next(error);
    }
  };

  getPrescriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const prescription = await this.prescriptionService.getPrescriptionById(id, user.id, user.role);
      const dto = mapPrescriptionToDTO(prescription as any);

      res.status(200).json(formatSuccessResponse('Prescription details retrieved successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  dispensePrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const prescription = await this.prescriptionService.dispensePrescription(id);
      const dto = mapPrescriptionToDTO(prescription as any);

      res.status(200).json(formatSuccessResponse('Prescription successfully dispensed', dto));
    } catch (error) {
      next(error);
    }
  };
}
export default PrescriptionController;
