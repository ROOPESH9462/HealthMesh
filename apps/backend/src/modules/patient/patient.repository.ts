import PatientModel, { IPatientDocument } from './Patient.model';
import { IPaginationMeta } from '@healthcare/shared-utils';

export class PatientRepository {
  /**
   * List active patients, populating User details
   */
  async listPatients(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = { isDeleted: false };

    if (filter.search) {
      // Simple lookup or we handle it in services
    }

    const total = await PatientModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await PatientModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl role')
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

  async findById(id: string): Promise<IPatientDocument | null> {
    return PatientModel.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl role')
      .exec();
  }

  async findByUserId(userId: string): Promise<IPatientDocument | null> {
    return PatientModel.findOne({ userId, isDeleted: false })
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl role')
      .exec();
  }
}
export default PatientRepository;
