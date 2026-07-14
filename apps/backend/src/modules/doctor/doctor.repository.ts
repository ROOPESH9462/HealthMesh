import DoctorModel, { IDoctorDocument } from './Doctor.model';
import { IPaginationMeta } from '@healthcare/shared-utils';

export class DoctorRepository {
  /**
   * List active doctors, populating their User identities
   */
  async listDoctors(
    filter: Record<string, any> = {},
    pagination: { page: number; limit: number }
  ): Promise<{ data: any[]; pagination: IPaginationMeta }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = { 
      isDeleted: false, 
      isActive: true 
    };

    if (filter.specialization) {
      mongoFilter.specialization = new RegExp(filter.specialization, 'i');
    }

    const total = await DoctorModel.countDocuments(mongoFilter).exec();
    const pages = Math.ceil(total / limit) || 1;

    const results = await DoctorModel.find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl role')
      .exec();

    // Map to JSON representations
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
   * Find doctor by ID
   */
  async findById(id: string): Promise<IDoctorDocument | null> {
    return DoctorModel.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl role')
      .exec();
  }
}
export default DoctorRepository;
