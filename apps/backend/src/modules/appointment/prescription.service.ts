import PrescriptionRepository from './prescription.repository';
import AppointmentModel from './Appointment.model';
import DoctorModel from '../doctor/Doctor.model';
import MedicineModel from '../pharmacy/Medicine.model';
import BillService from '../billing/bill.service';
import { withTransaction } from '../../utils/transaction';
import { NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { AppointmentStatus, UserRole } from '@healthcare/shared-types';
import logger from '../../utils/logger';

export class PrescriptionService {
  private prescriptionRepo = new PrescriptionRepository();
  private billService = new BillService();

  /**
   * Create prescription script, calculate drug charges, generate bill invoice, and complete appointment
   */
  async createPrescription(params: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    medicines: Array<{
      medicineId: string;
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    instructions?: string;
  }) {
    return withTransaction(async (session) => {
      // 1. Verify Appointment matches
      const appointment = await AppointmentModel.findById(params.appointmentId).session(session).exec();
      if (!appointment) {
        throw new NotFoundError('Clinical appointment slot not found');
      }

      const terminalStates = [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW
      ];
      if (terminalStates.includes(appointment.status as any)) {
        throw new BadRequestError(`Cannot write prescription for appointment in terminal state: ${appointment.status}`);
      }

      // 2. Fetch Doctor details for consultation fee
      const doctor = await DoctorModel.findById(params.doctorId).session(session).exec();
      if (!doctor) {
        throw new NotFoundError('Doctor profile not found');
      }

      // 3. Create Prescription document
      const prescription = await this.prescriptionRepo.create(
        {
          appointmentId: params.appointmentId,
          patientId: params.patientId,
          doctorId: params.doctorId,
          medicines: params.medicines,
          instructions: params.instructions,
          isFilled: false,
          issuedDate: new Date(),
        },
        session
      );

      // 4. Calculate medicine costs
      const billItems: Array<{ description: string; amount: number }> = [
        { description: `Consultation Fee (Dr. ${doctor.specialization})`, amount: doctor.consultationFee }
      ];

      for (const item of params.medicines) {
        const med = await MedicineModel.findById(item.medicineId).session(session).exec();
        const basePrice = med ? med.pricePerUnit : 15; // default fallback medicine price
        
        // Parse days from duration (e.g. "5 days" -> 5)
        const daysMatch = item.duration.match(/\d+/);
        const days = daysMatch ? parseInt(daysMatch[0], 10) : 5;

        // Parse dosage count (e.g. "1-0-1" -> 2 tablets/day)
        const dosesCount = item.dosage.split('-').reduce((acc, current) => {
          const val = parseInt(current, 10);
          return acc + (isNaN(val) ? 0 : val);
        }, 0) || 1;

        const totalQty = days * dosesCount;
        const totalMedPrice = basePrice * totalQty;

        billItems.push({
          description: `${item.medicineName} (${item.dosage} for ${item.duration})`,
          amount: totalMedPrice
        });
      }

      // 5. Generate billing invoice
      await this.billService.createBill(
        {
          patientId: params.patientId,
          appointmentId: params.appointmentId,
          prescriptionId: prescription.id,
          items: billItems,
        },
        session
      );

      // 6. Complete appointment consultation
      appointment.status = AppointmentStatus.COMPLETED;
      await appointment.save({ session });

      logger.info(`Prescription created for appointment ${params.appointmentId}. Invoice generated & status set to COMPLETED.`);
      return prescription;
    });
  }

  /**
   * List prescriptions with filters
   */
  async getPrescriptions(params: {
    userId: string;
    role: string;
    page: number;
    limit: number;
    patientId?: string;
  }) {
    const filter: Record<string, any> = {};

    if (params.role === UserRole.PATIENT) {
      const PatientModel = require('../patient/Patient.model').default;
      const patient = await PatientModel.findOne({ userId: params.userId }).exec();
      if (!patient) {
        throw new NotFoundError('Patient profile not found');
      }
      filter.patientId = patient._id;
    } else if (params.patientId) {
      filter.patientId = params.patientId;
    }

    return this.prescriptionRepo.listPrescriptions(filter, { page: params.page, limit: params.limit });
  }

  /**
   * Retrieve single prescription, checking patient/doctor ownership bounds
   */
  async getPrescriptionById(id: string, userId: string, role: string) {
    const prescription = await this.prescriptionRepo.findById(id);
    if (!prescription) {
      throw new NotFoundError('Prescription not found');
    }

    if (role === UserRole.PATIENT) {
      const PatientModel = require('../patient/Patient.model').default;
      const patient = await PatientModel.findOne({ userId }).exec();
      if (!patient || prescription.patientId._id.toString() !== patient._id.toString()) {
        throw new BadRequestError('Unauthorized access to this prescription record');
      }
    } else if (role === UserRole.DOCTOR) {
      const DoctorModel = require('../doctor/Doctor.model').default;
      const doctor = await DoctorModel.findOne({ userId }).exec();
      if (!doctor || prescription.doctorId._id.toString() !== doctor._id.toString()) {
        throw new BadRequestError('Clinician is unauthorized to view other doctor scripts');
      }
    }

    return prescription;
  }

  /**
   * Pharmacist fills and dispenses prescription, updating medicine stock levels
   */
  async dispensePrescription(id: string) {
    return withTransaction(async (session) => {
      const prescription = await this.prescriptionRepo.findById(id);
      if (!prescription) {
        throw new NotFoundError('Prescription script not found');
      }

      if (prescription.isFilled) {
        throw new BadRequestError('Prescription script has already been dispensed');
      }

      // Check stock availability and decrement counts
      for (const item of prescription.medicines) {
        const med = await MedicineModel.findById(item.medicineId).session(session).exec();
        if (!med) {
          throw new NotFoundError(`Medicine ${item.medicineName} not found in inventory catalog`);
        }

        // Parse dosage and duration to compute total quantity
        const daysMatch = item.duration.match(/\d+/);
        const days = daysMatch ? parseInt(daysMatch[0], 10) : 5;

        const dosesCount = item.dosage.split('-').reduce((acc, current) => {
          const val = parseInt(current, 10);
          return acc + (isNaN(val) ? 0 : val);
        }, 0) || 1;

        const qtyNeeded = days * dosesCount;

        if (med.stockCount < qtyNeeded) {
          throw new BadRequestError(`Insufficient stock for ${item.medicineName}. Available: ${med.stockCount}, Needed: ${qtyNeeded}`);
        }

        // Decrement stock count
        med.stockCount -= qtyNeeded;
        await med.save({ session });

        // Trigger warning logs if stock levels drop below thresholds
        if (med.stockCount < med.lowStockThreshold) {
          logger.warn(`LOW STOCK ALERT: Medicine ${med.name} count is at ${med.stockCount}. Threshold is ${med.lowStockThreshold}`);
        }
      }

      // Update prescription state to filled
      const updated = await this.prescriptionRepo.updateFillStatus(id, true, session);
      logger.info(`Prescription ${id} successfully dispensed.`);
      return updated;
    });
  }
}
export default PrescriptionService;
