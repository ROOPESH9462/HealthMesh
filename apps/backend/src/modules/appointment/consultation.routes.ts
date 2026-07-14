import { Router } from 'express';
import ConsultationController from './consultation.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new ConsultationController();

router.use(protect);

// Clinician starting video session call
router.post(
  '/start',
  restrictTo(UserRole.DOCTOR, UserRole.ADMIN),
  controller.startSession
);

// Clinician ending call and adding logs
router.post(
  '/end',
  restrictTo(UserRole.DOCTOR, UserRole.ADMIN),
  controller.endSession
);

// Get session details and logs (Both Patient and Doctor)
router.get(
  '/:appointmentId',
  controller.getSession
);

export default router;
