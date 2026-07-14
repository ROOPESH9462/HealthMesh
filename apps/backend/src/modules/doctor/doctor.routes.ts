import { Router } from 'express';
import DoctorController from './doctor.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const controller = new DoctorController();

// Protect all doctor routing endpoints
router.use(protect);

router.get('/', controller.getDoctors);
router.get('/:id', controller.getDoctorById);

export default router;
