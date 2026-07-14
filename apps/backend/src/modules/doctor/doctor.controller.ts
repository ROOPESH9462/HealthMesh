import { Request, Response, NextFunction } from 'express';
import DoctorService from './doctor.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';
import { mapDoctorToDTO } from '@healthcare/api-contracts';

export class DoctorController {
  private doctorService = new DoctorService();

  getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const specialization = req.query.specialization as string;

      const { data, pagination } = await this.doctorService.getDoctors({
        page,
        limit,
        specialization,
      });

      // Map Mongoose documents to DTO structure
      const mappedData = data.map((doc: any) => mapDoctorToDTO(doc));

      res.status(200).json(formatSuccessResponse('Doctors list retrieved successfully', mappedData, pagination));
    } catch (error) {
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const doctor = await this.doctorService.getDoctorById(id);
      const dto = mapDoctorToDTO(doctor as any);

      res.status(200).json(formatSuccessResponse('Doctor profile retrieved successfully', dto));
    } catch (error) {
      next(error);
    }
  };
}
export default DoctorController;
