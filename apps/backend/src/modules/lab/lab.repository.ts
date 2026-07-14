import MedicalDocumentModel, { IMedicalDocumentDocument } from './MedicalDocument.model';
import { IPaginationMeta } from '@healthcare/shared-utils';
import { ClientSession } from 'mongoose';

export class LabRepository {
  /**
   * Save a new MedicalDocument record
   */
  async createDocument(data: any, session?: ClientSession): Promise<IMedicalDocumentDocument> {
    const docs = await MedicalDocumentModel.create([data], { session });
    return docs[0];
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<IMedicalDocumentDocument | null> {
    return MedicalDocumentModel.findById(id)
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        select: 'userId specialization',
        populate: { path: 'userId', select: 'firstName lastName' }
      })
      .exec();
  }

  /**
   * List medical documents with pagination
   */
  async listDocuments(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter = { ...filter };

    const total = await MedicalDocumentModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await MedicalDocumentModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate({
        path: 'doctorId',
        select: 'userId specialization',
        populate: { path: 'userId', select: 'firstName lastName' }
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
   * Delete a medical document
   */
  async deleteDocument(id: string): Promise<IMedicalDocumentDocument | null> {
    return MedicalDocumentModel.findByIdAndDelete(id).exec();
  }

  /**
   * Verify lab reports (Doctor signatures)
   */
  async verifyReport(id: string, doctorId: string, session?: ClientSession): Promise<IMedicalDocumentDocument | null> {
    return MedicalDocumentModel.findByIdAndUpdate(
      id,
      { isVerifiedByDoctor: true, doctorId },
      { new: true, session }
    ).exec();
  }
}
export default LabRepository;
