import { Request, Response, NextFunction } from 'express';
import AppointmentService from './appointment.service';
import { 
  formatSuccessResponse, 
  appointmentBookingSchema,
  appointmentRescheduleSchema,
  cancelAppointmentSchema,
  getSlotsQuerySchema
} from '@healthcare/shared-utils';
import { mapAppointmentToDTO } from '@healthcare/api-contracts';

export class AppointmentController {
  private appointmentService = new AppointmentService();

  /**
   * GET /api/v1/appointments/slots
   * Returns available time slots for doctor and date
   */
  getAvailableSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = getSlotsQuerySchema.parse(req.query);
      const slots = await this.appointmentService.getAvailableSlots(validated.doctorId, validated.date);
      res.status(200).json(formatSuccessResponse('Available slots fetched successfully', slots));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/appointments
   * Book an appointment slot
   */
  bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = appointmentBookingSchema.parse(req.body);
      const user = (req as any).user;

      const appt = await this.appointmentService.bookAppointment({
        userId: user.id,
        role: user.role,
        doctorId: validated.doctorId,
        patientId: validated.patientId,
        dateStr: validated.date,
        timeSlot: validated.timeSlot,
        symptomsDescription: validated.symptomsDescription,
      });

      const dto = mapAppointmentToDTO(appt);
      res.status(201).json(formatSuccessResponse('Appointment booked successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/appointments/:id/cancel
   * Cancel an active booking
   */
  cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = cancelAppointmentSchema.parse(req.body);
      const user = (req as any).user;

      const appt = await this.appointmentService.cancelAppointment(
        id,
        validated.cancellationReason,
        user.id,
        user.role
      );

      const dto = mapAppointmentToDTO(appt);
      res.status(200).json(formatSuccessResponse('Appointment cancelled successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/appointments/:id/reschedule
   * Reschedule appointment timing
   */
  rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = appointmentRescheduleSchema.parse(req.body);
      const user = (req as any).user;

      const appt = await this.appointmentService.rescheduleAppointment({
        id,
        newDateStr: validated.date,
        newTimeSlot: validated.timeSlot,
        userId: user.id,
        role: user.role,
      });

      const dto = mapAppointmentToDTO(appt);
      res.status(200).json(formatSuccessResponse('Appointment rescheduled successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/appointments/:id/check-in
   * Receptionist check-in process
   */
  checkInAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const appt = await this.appointmentService.checkInAppointment(id);
      const dto = mapAppointmentToDTO(appt);
      res.status(200).json(formatSuccessResponse('Patient checked in successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/appointments/:id/complete
   * Complete a patient consultation (Clinician only)
   */
  completeAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      
      const appt = await this.appointmentService.completeAppointment(id, user.id);
      const dto = mapAppointmentToDTO(appt);
      res.status(200).json(formatSuccessResponse('Consultation completed successfully', dto));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/appointments
   * List appointments with pagination
   */
  getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const patientId = req.query.patientId as string;
      const doctorId = req.query.doctorId as string;

      const { data, pagination } = await this.appointmentService.getAppointments({
        userId: user.id,
        role: user.role,
        page,
        limit,
        status,
        startDate,
        endDate,
        patientId,
        doctorId,
      });

      // Map Mongoose documents to DTO structure
      const mappedData = data.map((appt: any) => mapAppointmentToDTO(appt));

      res.status(200).json(formatSuccessResponse('Appointments retrieved successfully', mappedData, pagination));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/appointments/:id
   * Retrieve single appointment
   */
  getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const appt = await this.appointmentService.getAppointmentById(id, user.id, user.role);
      const dto = mapAppointmentToDTO(appt);

      res.status(200).json(formatSuccessResponse('Appointment details retrieved', dto));
    } catch (error) {
      next(error);
    }
  };
}
export default AppointmentController;
