import { Router } from 'express';
import AnalyticsController from './analytics.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new AnalyticsController();

router.use(protect);

router.get(
  '/admin',
  restrictTo(UserRole.ADMIN),
  controller.getAdminStats
);

router.get(
  '/doctor',
  restrictTo(UserRole.DOCTOR),
  controller.getDoctorStats
);

router.get(
  '/pharmacy',
  restrictTo(UserRole.PHARMACIST, UserRole.ADMIN),
  controller.getPharmacyStats
);

router.get(
  '/laboratory',
  restrictTo(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR),
  controller.getLabStats
);

export default router;
