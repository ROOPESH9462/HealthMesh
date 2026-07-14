import DoctorRepository from './doctor.repository';
import { NotFoundError } from '@healthcare/shared-utils';

export class DoctorService {
  private doctorRepo = new DoctorRepository();

  async getDoctors(params: { page: number; limit: number; specialization?: string }) {
    const { page, limit, specialization } = params;
    const filter: Record<string, any> = {};

    if (specialization) {
      filter.specialization = specialization;
    }

    return this.doctorRepo.listDoctors(filter, { page, limit });
  }

  async getDoctorById(id: string) {
    const doctor = await this.doctorRepo.findById(id);
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found.');
    }
    return doctor;
  }
}
export default DoctorService;
