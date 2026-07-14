import mongoose, { ClientSession } from 'mongoose';
import AppointmentModel, { IAppointmentDocument } from './Appointment.model';
import { AppointmentStatus } from '@healthcare/shared-types';
import { IPaginationMeta } from '@healthcare/shared-utils';

export class AppointmentRepository {
  /**
   * Find active bookings for a doctor on a specific date
   */
  async findActiveBookingsByDoctorAndDate(
    doctorId: string,
    date: Date,
    session?: ClientSession
  ): Promise<IAppointmentDocument[]> {
    // Start of the day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    // End of the day
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return AppointmentModel.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { 
        $in: [
          AppointmentStatus.SCHEDULED, 
          AppointmentStatus.CONFIRMED, 
          AppointmentStatus.CHECKED_IN, 
          AppointmentStatus.IN_CONSULTATION
        ] 
      }
    })
      .session(session || null)
      .exec();
  }

  /**
   * Check if a patient already has an active booking at the same slot
   */
  async findActiveBookingByPatientAndSlot(
    patientId: string,
    date: Date,
    timeSlot: string,
    session?: ClientSession
  ): Promise<IAppointmentDocument | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return AppointmentModel.findOne({
      patientId: new mongoose.Types.ObjectId(patientId),
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: {
        $in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.IN_CONSULTATION
        ]
      }
    })
      .session(session || null)
      .exec();
  }

  /**
   * Create an appointment
   */
  async bookAppointment(
    data: {
      patientId: string;
      doctorId: string;
      date: Date;
      timeSlot: string;
      symptomsDescription?: string;
      status?: AppointmentStatus;
    },
    session?: ClientSession
  ): Promise<IAppointmentDocument> {
    const [appointment] = await AppointmentModel.create(
      [
        {
          patientId: new mongoose.Types.ObjectId(data.patientId),
          doctorId: new mongoose.Types.ObjectId(data.doctorId),
          date: data.date,
          timeSlot: data.timeSlot,
          symptomsDescription: data.symptomsDescription,
          status: data.status || AppointmentStatus.SCHEDULED,
        }
      ],
      { session }
    );
    return appointment;
  }

  /**
   * Find appointment by ID with full patient, doctor, and user details populated
   */
  async findByIdWithDetails(id: string): Promise<IAppointmentDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return AppointmentModel.findById(id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber avatarUrl role' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber avatarUrl role' }
      })
      .exec();
  }

  /**
   * Save Mongoose document modifications
   */
  async save(appointment: IAppointmentDocument, session?: ClientSession): Promise<IAppointmentDocument> {
    if (session) {
      appointment.$session(session);
    }
    return appointment.save();
  }

  /**
   * List paginated appointments with dynamic sorting and filters
   */
  async listAppointments(
    filter: Record<string, any>,
    pagination: { page: number; limit: number },
    sort: Record<string, any> = { date: -1 }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = {};

    if (filter.patientId) {
      mongoFilter.patientId = new mongoose.Types.ObjectId(filter.patientId);
    }
    if (filter.doctorId) {
      mongoFilter.doctorId = new mongoose.Types.ObjectId(filter.doctorId);
    }
    if (filter.status) {
      mongoFilter.status = filter.status;
    }
    if (filter.startDate || filter.endDate) {
      mongoFilter.date = {};
      if (filter.startDate) {
        mongoFilter.date.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        mongoFilter.date.$lte = new Date(filter.endDate);
      }
    }

    const total = await AppointmentModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await AppointmentModel.find(mongoFilter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber avatarUrl role' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber avatarUrl role' }
      })
      .exec();

    // Map Mongoose documents to DTO structure
    const data = results.map((doc) => doc.toJSON());

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }
}
