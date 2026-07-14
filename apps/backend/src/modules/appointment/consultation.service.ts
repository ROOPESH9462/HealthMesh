import ConsultationModel from './Consultation.model';
import AppointmentModel from './Appointment.model';
import DoctorModel from '../doctor/Doctor.model';
import PatientModel from '../patient/Patient.model';
import { NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { UserRole, AppointmentStatus } from '@healthcare/shared-types';
import logger from '../../utils/logger';

export class ConsultationService {
  /**
   * Start consultation session, create DB record and transition Appointment status to IN_CONSULTATION
   */
  async startConsultation(appointmentId: string, doctorUserId: string) {
    const doctor = await DoctorModel.findOne({ userId: doctorUserId }).exec();
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    const appointment = await AppointmentModel.findById(appointmentId).exec();
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      throw new BadRequestError('Unauthorized. This appointment belongs to another clinician.');
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot start call. Appointment status is currently ${appointment.status}`);
    }

    // Update appointment status
    appointment.status = AppointmentStatus.IN_CONSULTATION;
    await appointment.save();

    // Check if consultation session already exists
    let consultation = await ConsultationModel.findOne({ appointmentId }).exec();
    if (!consultation) {
      consultation = await ConsultationModel.create({
        appointmentId,
        doctorId: doctor._id.toString(),
        patientId: appointment.patientId.toString(),
        startTime: new Date(),
        messages: []
      });
      logger.info(`Consultation session initialized for appointment ${appointmentId}`);
    }

    return consultation;
  }

  /**
   * End consultation call, compute duration, update status and save notes
   */
  async endConsultation(appointmentId: string, doctorUserId: string, notes?: string) {
    const doctor = await DoctorModel.findOne({ userId: doctorUserId }).exec();
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found');
    }

    const consultation = await ConsultationModel.findOne({ appointmentId }).exec();
    if (!consultation) {
      throw new NotFoundError('Consultation session log not found');
    }

    const appointment = await AppointmentModel.findById(appointmentId).exec();
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Calculate duration
    const endTime = new Date();
    const startTime = new Date(consultation.startTime);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    consultation.endTime = endTime;
    consultation.durationSeconds = durationSeconds;
    if (notes) {
      consultation.notes = notes;
    }
    await consultation.save();

    // Update appointment status to COMPLETED
    appointment.status = AppointmentStatus.COMPLETED;
    await appointment.save();

    logger.info(`Consultation session ${consultation._id} closed. Duration: ${durationSeconds} seconds.`);
    return consultation;
  }

  /**
   * Retrieve consultation session details with verification checks
   */
  async getConsultation(appointmentId: string, userId: string, role: string) {
    const consultation = await ConsultationModel.findOne({ appointmentId }).exec();
    if (!consultation) {
      throw new NotFoundError('Consultation session log not found');
    }

    // Privacy access checks
    if (role === UserRole.PATIENT) {
      const patient = await PatientModel.findOne({ userId }).exec();
      if (!patient || consultation.patientId.toString() !== patient._id.toString()) {
        throw new BadRequestError('Access denied. This consultation does not belong to your patient profile.');
      }
    } else if (role === UserRole.DOCTOR) {
      const doctor = await DoctorModel.findOne({ userId }).exec();
      if (!doctor || consultation.doctorId.toString() !== doctor._id.toString()) {
        throw new BadRequestError('Access denied. This consultation belongs to another clinician.');
      }
    }

    return consultation;
  }
}
export default ConsultationService;
