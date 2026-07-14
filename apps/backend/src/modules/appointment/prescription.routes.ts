import { Router } from 'express';
import PrescriptionController from './prescription.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new PrescriptionController();

// Protect all routing endpoints
router.use(protect);

// Issue script - Clinician only
router.post(
  '/', 
  restrictTo(UserRole.DOCTOR, UserRole.ADMIN), 
  controller.createPrescription
);

// List scripts
router.get('/', controller.getPrescriptions);

// Single script retrieval
router.get('/:id', controller.getPrescriptionById);

// Dispense script - Pharmacist only
router.patch(
  '/:id/dispense', 
  restrictTo(UserRole.PHARMACIST, UserRole.ADMIN), 
  controller.dispensePrescription
);

export default router;
