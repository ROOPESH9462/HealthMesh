import { Request, Response, NextFunction } from 'express';
import PatientService from './patient.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';
import { mapPatientToDTO } from '@healthcare/api-contracts';
import { UserRole } from '@healthcare/shared-types';

export class PatientController {
  private patientService = new PatientService();

  getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const user = (req as any).user;

      let result;
      if (user?.role === UserRole.PATIENT) {
        const patient = await this.patientService.getPatientByUserId(user.id);
        result = {
          data: [patient],
          pagination: { page: 1, limit: 1, total: 1, pages: 1 }
        };
      } else {
        const { data, pagination } = await this.patientService.getPatients({
          page,
          limit,
        });
        result = { data, pagination };
      }

      // Map Mongoose documents to DTO structure
      const mappedData = result.data.map((doc: any) => mapPatientToDTO(doc));

      res.status(200).json(formatSuccessResponse('Patients list retrieved successfully', mappedData, result.pagination));
    } catch (error) {
      next(error);
    }
  };

  getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const patient = await this.patientService.getPatientById(id);
      const dto = mapPatientToDTO(patient as any);

      res.status(200).json(formatSuccessResponse('Patient profile retrieved successfully', dto));
    } catch (error) {
      next(error);
    }
  };
}
export default PatientController;
