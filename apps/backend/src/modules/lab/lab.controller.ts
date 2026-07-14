import { Request, Response, NextFunction } from 'express';
import LabService from './lab.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';
import { mapMedicalDocumentToDTO } from '@healthcare/api-contracts';

export class LabController {
  private labService = new LabService();

  uploadReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const file = req.file as Express.Multer.File;
      const { patientId, documentType, title } = req.body;

      const doc = await this.labService.uploadReport({
        patientId,
        documentType,
        title,
        file,
        userId: user.id,
        role: user.role,
      });

      const dto = mapMedicalDocumentToDTO(doc as any);
      res.status(201).json(formatSuccessResponse('Lab report uploaded successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const patientId = req.query.patientId as string;
      const documentType = req.query.documentType as string;

      const { data, pagination } = await this.labService.getDocuments({
        userId: user.id,
        role: user.role,
        page,
        limit,
        patientId,
        documentType,
      });

      const mapped = data.map((item: any) => mapMedicalDocumentToDTO(item));
      res.status(200).json(formatSuccessResponse('Medical documents list retrieved successfully', mapped, pagination));
    } catch (error) {
      next(error);
    }
  };

  getDocumentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const doc = await this.labService.getDocumentById(id, user.id, user.role);
      const dto = mapMedicalDocumentToDTO(doc as any);

      res.status(200).json(formatSuccessResponse('Medical document details retrieved', dto));
    } catch (error) {
      next(error);
    }
  };

  verifyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const doc = await this.labService.verifyReport(id, user.id);
      const dto = mapMedicalDocumentToDTO(doc as any);

      res.status(200).json(formatSuccessResponse('Lab report verified and signed off', dto));
    } catch (error) {
      next(error);
    }
  };

  deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const doc = await this.labService.deleteReport(id, user.id, user.role);
      const dto = mapMedicalDocumentToDTO(doc as any);

      res.status(200).json(formatSuccessResponse('Laboratory report deleted successfully', dto));
    } catch (error) {
      next(error);
    }
  };
}
export default LabController;
