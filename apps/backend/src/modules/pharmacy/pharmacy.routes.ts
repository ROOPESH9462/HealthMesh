import { Router } from 'express';
import PharmacyController from './pharmacy.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new PharmacyController();

// Protect all routing endpoints
router.use(protect);

// Catalog searches - available to all logged-in staff/patients
router.get('/', controller.getMedicines);
router.get('/:id', controller.getMedicineById);

// Catalog updates - Pharmacist/Admin only
router.post(
  '/', 
  restrictTo(UserRole.PHARMACIST, UserRole.ADMIN), 
  controller.createMedicine
);

// Stock replenishments
router.post(
  '/batches', 
  restrictTo(UserRole.PHARMACIST, UserRole.ADMIN), 
  controller.addInventoryBatch
);

export default router;
