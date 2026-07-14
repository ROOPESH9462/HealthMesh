import { Router } from 'express';
import AppointmentController from './appointment.controller';
import { protect, restrictTo } from '../../middleware/auth.middleware';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const controller = new AppointmentController();

// All routes require authentication
router.use(protect);

// Availability checking - available to all roles
router.get('/slots', controller.getAvailableSlots);

// Booking creation
router.post(
  '/', 
  restrictTo(UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.ADMIN), 
  controller.bookAppointment
);

// Listing all appointments
router.get('/', controller.getAppointments);

// Single appointment retrieval
router.get('/:id', controller.getAppointmentById);

// Cancellations
router.patch('/:id/cancel', controller.cancelAppointment);

// Reschedules
router.patch(
  '/:id/reschedule', 
  restrictTo(UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.ADMIN), 
  controller.rescheduleAppointment
);

// Front desk Check-in process
router.patch(
  '/:id/check-in', 
  restrictTo(UserRole.RECEPTIONIST, UserRole.ADMIN), 
  controller.checkInAppointment
);

// Clinical completion
router.patch(
  '/:id/complete', 
  restrictTo(UserRole.DOCTOR, UserRole.ADMIN), 
  controller.completeAppointment
);

export default router;
