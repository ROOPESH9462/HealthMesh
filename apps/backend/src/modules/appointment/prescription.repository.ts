import PrescriptionModel, { IPrescriptionDocument } from './Prescription.model';
import { IPaginationMeta } from '@healthcare/shared-utils';
import { ClientSession } from 'mongoose';

export class PrescriptionRepository {
  /**
   * Save a new prescription inside a database transaction session
   */
  async create(data: any, session?: ClientSession): Promise<IPrescriptionDocument> {
    const docs = await PrescriptionModel.create([data], { session });
    return docs[0];
  }

  /**
   * List prescriptions with pagination and populate options
   */
  async listPrescriptions(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = { ...filter };

    const total = await PrescriptionModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await PrescriptionModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .populate('appointmentId', 'date timeSlot status')
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        select: 'userId specialization consultationFee',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .exec();

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

  /**
   * Find prescription by ID
   */
  async findById(id: string): Promise<IPrescriptionDocument | null> {
    return PrescriptionModel.findById(id)
      .populate('appointmentId', 'date timeSlot status')
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        select: 'userId specialization consultationFee',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .exec();
  }

  /**
   * Update prescription fill status
   */
  async updateFillStatus(id: string, isFilled: boolean, session?: ClientSession): Promise<IPrescriptionDocument | null> {
    return PrescriptionModel.findByIdAndUpdate(id, { isFilled }, { new: true, session }).exec();
  }
}
export default PrescriptionRepository;
