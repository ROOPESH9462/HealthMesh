import { Router } from 'express';
import PatientController from './patient.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new PatientController();

// Protect all patient routing endpoints
router.use(protect);

router.get('/', restrictTo(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.PATIENT), controller.getPatients);
router.get('/:id', restrictTo(UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.ADMIN), controller.getPatientById);

export default router;
