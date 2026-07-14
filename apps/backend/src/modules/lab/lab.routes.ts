import { Router } from 'express';
import LabController from './lab.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import upload from '../../middleware/upload.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new LabController();

// Protect all routing paths
router.use(protect);

// Upload laboratory report file - Staff, admins and patients
router.post(
  '/', 
  restrictTo(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.PATIENT),
  upload.single('file'),
  controller.uploadReport
);

// List laboratory reports
router.get('/', controller.getDocuments);

// Single report details
router.get('/:id', controller.getDocumentById);

// Clinician verification signatures - Doctor / Admin only
router.patch(
  '/:id/verify', 
  restrictTo(UserRole.DOCTOR, UserRole.ADMIN),
  controller.verifyReport
);

// Delete records - Staff / Admin only
router.delete(
  '/:id', 
  restrictTo(UserRole.RECEPTIONIST, UserRole.ADMIN),
  controller.deleteReport
);

export default router;
