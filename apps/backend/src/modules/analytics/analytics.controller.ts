import { Request, Response, NextFunction } from 'express';
import AnalyticsService from './analytics.service';
import { formatSuccessResponse } from '@healthcare/shared-utils';

export class AnalyticsController {
  private service = new AnalyticsService();

  getAdminStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getAdminStats();
      res.status(200).json(formatSuccessResponse('Admin analytics compiled', stats));
    } catch (error) {
      next(error);
    }
  };

  getDoctorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const stats = await this.service.getDoctorStats(user.id);
      res.status(200).json(formatSuccessResponse('Doctor analytics compiled', stats));
    } catch (error) {
      next(error);
    }
  };

  getPharmacyStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getPharmacyStats();
      res.status(200).json(formatSuccessResponse('Pharmacy analytics compiled', stats));
    } catch (error) {
      next(error);
    }
  };

  getLabStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getLabStats();
      res.status(200).json(formatSuccessResponse('Laboratory analytics compiled', stats));
    } catch (error) {
      next(error);
    }
  };
}
export default AnalyticsController;
