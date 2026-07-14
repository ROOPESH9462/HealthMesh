import { Request, Response, NextFunction } from 'express';
import ConsultationService from './consultation.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';

export class ConsultationController {
  private service = new ConsultationService();

  startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { appointmentId } = req.body;
      
      const session = await this.service.startConsultation(appointmentId, user.id);
      res.status(200).json(formatSuccessResponse('Consultation session started successfully', session));
    } catch (error) {
      next(error);
    }
  };

  endSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { appointmentId, notes } = req.body;
      
      const session = await this.service.endConsultation(appointmentId, user.id, notes);
      res.status(200).json(formatSuccessResponse('Consultation session ended successfully', session));
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { appointmentId } = req.params;
      
      const session = await this.service.getConsultation(appointmentId, user.id, user.role);
      res.status(200).json(formatSuccessResponse('Consultation session details retrieved', session));
    } catch (error) {
      next(error);
    }
  };
}
export default ConsultationController;
