import mongoose from 'mongoose';
import { AppointmentRepository } from './appointment.repository';
import { AvailabilityService } from './availability.service';
import DoctorModel from '../doctor/Doctor.model';
import PatientModel from '../patient/Patient.model';
import { AppointmentStatus, UserRole } from '@healthcare/shared-types';
import { 
  BadRequestError, 
  NotFoundError, 
  ConflictError, 
  ForbiddenError, 
  ErrorCode 
} from '@healthcare/shared-utils';
import { withTransaction } from '../../utils/transaction';
import logger from '../../utils/logger';

export class AppointmentService {
  private appointmentRepo = new AppointmentRepository();
  private availabilityService = new AvailabilityService();

  /**
   * Get dynamic available slots for a doctor on a specific date string (YYYY-MM-DD)
   */
  async getAvailableSlots(doctorId: string, dateStr: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestError('Invalid Doctor ID format');
    }

    const doctor = await DoctorModel.findOne({ _id: doctorId, isDeleted: false, isActive: true }).exec();
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found or is currently inactive');
    }

    // Retrieve active bookings on target date
    const activeBookings = await this.appointmentRepo.findActiveBookingsByDoctorAndDate(doctorId, new Date(dateStr));
    const bookedSlotTimes = activeBookings.map((appt) => appt.timeSlot);

    // Dynamic slot generation
    return this.availabilityService.generateAvailableSlots(
      { availableDays: doctor.availableDays, timeSlots: doctor.timeSlots },
      dateStr,
      bookedSlotTimes
    );
  }

  /**
   * Books an appointment with transactional double-booking guards
   */
  async bookAppointment(params: {
    userId: string; // The user ID of the person making the booking
    role: UserRole; // The role of the person making the booking
    doctorId: string; // Doctor ID
    patientId?: string; // Patient ID (optional, receptionist overrides this)
    dateStr: string; // YYYY-MM-DD
    timeSlot: string; // e.g. "09:00 - 09:30"
    symptomsDescription?: string;
  }): Promise<any> {
    const { userId, role, doctorId, dateStr, timeSlot, symptomsDescription } = params;

    // 1. Resolve Patient ID
    let resolvedPatientId = '';
    if (role === UserRole.PATIENT) {
      const patientProfile = await PatientModel.findOne({ userId, isDeleted: false }).exec();
      if (!patientProfile) {
        throw new NotFoundError('Patient clinical profile is not initialized for this account.');
      }
      resolvedPatientId = patientProfile._id.toString();
    } else {
      // Staff (Receptionist/Admin) must provide patientId
      if (!params.patientId) {
        throw new BadRequestError('Patient ID is required when booking on behalf of a patient.');
      }
      resolvedPatientId = params.patientId;
    }

    if (!mongoose.Types.ObjectId.isValid(resolvedPatientId)) {
      throw new BadRequestError('Invalid Patient ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new BadRequestError('Invalid Doctor ID format');
    }

    // 2. Validate booking is not in the past
    const targetDate = new Date(dateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (dateStr < todayStr) {
      throw new BadRequestError('Appointments cannot be scheduled in past dates.');
    }

    // 3. Verify Doctor Availability & Concurrency under transaction
    return withTransaction(async (session) => {
      // Find doctor profile
      const doctor = await DoctorModel.findOne({ _id: doctorId, isDeleted: false, isActive: true })
        .session(session)
        .exec();
      if (!doctor) {
        throw new NotFoundError('Doctor is not available or profile does not exist.');
      }

      // Check slot availability using AvailabilityService
      const activeBookings = await this.appointmentRepo.findActiveBookingsByDoctorAndDate(doctorId, targetDate, session);
      const bookedSlotTimes = activeBookings.map((appt) => appt.timeSlot);

      const slots = this.availabilityService.generateAvailableSlots(
        { availableDays: doctor.availableDays, timeSlots: doctor.timeSlots },
        dateStr,
        bookedSlotTimes
      );

      const chosenSlot = slots.find((s) => s.timeSlot === timeSlot);
      if (!chosenSlot || !chosenSlot.isAvailable) {
        throw new BadRequestError(
          'The requested time slot is unavailable or falls outside the doctor\'s scheduling hours.',
          ErrorCode.APPOINTMENT_SLOT_UNAVAILABLE
        );
      }

      // Prevent patient from double-booking themselves in multiple consultations at the same timeSlot
      const patientHasConflict = await this.appointmentRepo.findActiveBookingByPatientAndSlot(
        resolvedPatientId,
        targetDate,
        timeSlot,
        session
      );
      if (patientHasConflict) {
        throw new ConflictError('You already have an active appointment booked at this exact time slot.');
      }

      // Create booking
      const status = role === UserRole.PATIENT ? AppointmentStatus.SCHEDULED : AppointmentStatus.CONFIRMED;

      try {
        const appointmentDoc = await this.appointmentRepo.bookAppointment(
          {
            patientId: resolvedPatientId,
            doctorId,
            date: targetDate,
            timeSlot,
            symptomsDescription,
            status,
          },
          session
        );

        logger.info(`Appointment booked successfully: ID ${appointmentDoc._id} by User ${userId}`);
        
        // Return full detail representation
        return appointmentDoc;
      } catch (err: any) {
        // Intercept duplicate-key concurrency errors (Mongo code 11000)
        if (err.code === 11000) {
          throw new ConflictError(
            'This slot was booked by another process. Please select a different timing.',
            ErrorCode.APPOINTMENT_SLOT_UNAVAILABLE
          );
        }
        throw err;
      }
    });
  }

  /**
   * Cancel appointment checking state machine transitions and permissions
   */
  async cancelAppointment(id: string, cancellationReason: string, userId: string, role: UserRole): Promise<any> {
    if (!cancellationReason) {
      throw new BadRequestError('A reason for cancellation must be supplied.');
    }

    const appt = await this.appointmentRepo.findByIdWithDetails(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    // Check permissions
    if (role === UserRole.PATIENT) {
      const patientProfile = await PatientModel.findOne({ userId, isDeleted: false }).exec();
      if (!patientProfile || appt.patientId._id.toString() !== patientProfile._id.toString()) {
        throw new ForbiddenError('You can only cancel your own appointments.');
      }
    }

    // Verify state machine lifecycle
    const terminalStates = [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW];
    if (terminalStates.includes(appt.status)) {
      throw new BadRequestError(
        `Cannot cancel appointment that is already in state: ${appt.status}`,
        ErrorCode.VALIDATION_FAILED
      );
    }

    appt.status = AppointmentStatus.CANCELLED;
    appt.cancellationReason = cancellationReason;

    await this.appointmentRepo.save(appt);
    logger.info(`Appointment ${appt.id} cancelled. Reason: ${cancellationReason}`);
    return appt;
  }

  /**
   * Reschedules an appointment using transactions
   */
  async rescheduleAppointment(params: {
    id: string;
    newDateStr: string;
    newTimeSlot: string;
    userId: string;
    role: UserRole;
  }): Promise<any> {
    const { id, newDateStr, newTimeSlot, userId, role } = params;

    const appt = await this.appointmentRepo.findByIdWithDetails(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    // Check permissions
    if (role === UserRole.PATIENT) {
      const patientProfile = await PatientModel.findOne({ userId, isDeleted: false }).exec();
      if (!patientProfile || appt.patientId._id.toString() !== patientProfile._id.toString()) {
        throw new ForbiddenError('You can only reschedule your own appointments.');
      }
    }

    // Validate state machine lifecycle
    const immutableStates = [
      AppointmentStatus.CHECKED_IN,
      AppointmentStatus.IN_CONSULTATION,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW
    ];
    if (immutableStates.includes(appt.status)) {
      throw new BadRequestError(
        `Cannot reschedule appointment that is currently in state: ${appt.status}`,
        ErrorCode.VALIDATION_FAILED
      );
    }

    // Validate date is not in the past
    const targetDate = new Date(newDateStr);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (newDateStr < todayStr) {
      throw new BadRequestError('Appointments cannot be rescheduled to past dates.');
    }

    return withTransaction(async (session) => {
      // Fetch doctor profile
      const doctorId = appt.doctorId._id.toString();
      const doctor = await DoctorModel.findOne({ _id: doctorId, isDeleted: false, isActive: true })
        .session(session)
        .exec();
      if (!doctor) {
        throw new NotFoundError('Doctor is no longer available.');
      }

      // Check slot availability using AvailabilityService
      const activeBookings = await this.appointmentRepo.findActiveBookingsByDoctorAndDate(doctorId, targetDate, session);
      const bookedSlotTimes = activeBookings.map((b) => b.timeSlot);

      const slots = this.availabilityService.generateAvailableSlots(
        { availableDays: doctor.availableDays, timeSlots: doctor.timeSlots },
        newDateStr,
        bookedSlotTimes
      );

      const chosenSlot = slots.find((s) => s.timeSlot === newTimeSlot);
      if (!chosenSlot || !chosenSlot.isAvailable) {
        throw new BadRequestError(
          'The requested time slot is unavailable or falls outside the doctor\'s working hours.',
          ErrorCode.APPOINTMENT_SLOT_UNAVAILABLE
        );
      }

      appt.date = targetDate;
      appt.timeSlot = newTimeSlot;
      appt.status = AppointmentStatus.RESCHEDULED;

      await this.appointmentRepo.save(appt, session);
      logger.info(`Appointment ${appt.id} rescheduled to ${newDateStr} at ${newTimeSlot}`);
      return appt;
    });
  }

  /**
   * Check-in appointment at receptionist desk
   */
  async checkInAppointment(id: string): Promise<any> {
    const appt = await this.appointmentRepo.findByIdWithDetails(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    // Valid inputs: SCHEDULED or CONFIRMED
    const allowed = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED];
    if (!allowed.includes(appt.status)) {
      throw new BadRequestError(`Cannot check-in appointment from state: ${appt.status}`);
    }

    appt.status = AppointmentStatus.CHECKED_IN;
    await this.appointmentRepo.save(appt);
    logger.info(`Appointment ${appt.id} checked in.`);
    return appt;
  }

  /**
   * Transition appointment into complete (Doctor writes prescriptions/completes consultation)
   */
  async completeAppointment(id: string, doctorUserId: string): Promise<any> {
    const appt = await this.appointmentRepo.findByIdWithDetails(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    // Verify it is the correct doctor completing
    const doctorProfile = await DoctorModel.findOne({ userId: doctorUserId, isDeleted: false }).exec();
    if (!doctorProfile || appt.doctorId._id.toString() !== doctorProfile._id.toString()) {
      throw new ForbiddenError('You can only complete consultations assigned to your clinical docket.');
    }

    // Valid state inputs: CHECKED_IN or IN_CONSULTATION or CONFIRMED (in case doctor starts without front desk check-in)
    const allowed = [AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_CONSULTATION, AppointmentStatus.CONFIRMED, AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED];
    if (!allowed.includes(appt.status)) {
      throw new BadRequestError(`Cannot complete consultation from state: ${appt.status}`);
    }

    appt.status = AppointmentStatus.COMPLETED;
    await this.appointmentRepo.save(appt);
    logger.info(`Appointment ${appt.id} completed by Doctor ${doctorUserId}`);
    return appt;
  }

  /**
   * List appointments with pagination and multi-role filters
   */
  async getAppointments(params: {
    userId: string;
    role: UserRole;
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    patientId?: string;
    doctorId?: string;
  }): Promise<any> {
    const { userId, role, page, limit, status, startDate, endDate } = params;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    // Role scoping:
    if (role === UserRole.PATIENT) {
      let patientProfile = await PatientModel.findOne({ userId, isDeleted: false }).exec();
      if (!patientProfile) {
        // Self-heal: Initialize missing patient profile on the fly
        patientProfile = await PatientModel.create({
          userId,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'OTHER',
          bloodGroup: 'O+',
          address: 'Not Specified',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Other',
            phone: '0000000000'
          }
        });
      }
      filter.patientId = patientProfile._id.toString();
    } else if (role === UserRole.DOCTOR) {
      let doctorProfile = await DoctorModel.findOne({ userId, isDeleted: false }).exec();
      if (!doctorProfile) {
        // Self-heal: Initialize missing doctor profile on the fly
        doctorProfile = await DoctorModel.create({
          userId,
          specialization: 'General Medicine',
          departmentId: 'DEP-GEN',
          qualification: ['MBBS'],
          experienceYears: 1,
          consultationFee: 500,
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: ['09:00 - 17:00'],
          isActive: true
        });
      }
      filter.doctorId = doctorProfile._id.toString();
    } else {
      // Staff (Receptionist/Admin) can filter by any patientId or doctorId if provided
      if (params.patientId) filter.patientId = params.patientId;
      if (params.doctorId) filter.doctorId = params.doctorId;
    }

    return this.appointmentRepo.listAppointments(filter, { page, limit });
  }

  /**
   * Retrieve single appointment detail
   */
  async getAppointmentById(id: string, userId: string, role: UserRole): Promise<any> {
    const appt = await this.appointmentRepo.findByIdWithDetails(id);
    if (!appt) {
      throw new NotFoundError('Appointment not found.');
    }

    // Role check
    if (role === UserRole.PATIENT) {
      const patientProfile = await PatientModel.findOne({ userId, isDeleted: false }).exec();
      if (!patientProfile || appt.patientId._id.toString() !== patientProfile._id.toString()) {
        throw new ForbiddenError('Access Denied. You do not have permissions to read this booking details.');
      }
    } else if (role === UserRole.DOCTOR) {
      const doctorProfile = await DoctorModel.findOne({ userId, isDeleted: false }).exec();
      if (!doctorProfile || appt.doctorId._id.toString() !== doctorProfile._id.toString()) {
        throw new ForbiddenError('Access Denied. This appointment is assigned to another doctor.');
      }
    }

    return appt;
  }
}
export default AppointmentService;
