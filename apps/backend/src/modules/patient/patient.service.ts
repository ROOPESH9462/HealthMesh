import PatientRepository from './patient.repository';
import { NotFoundError } from '@healthcare/shared-utils';

export class PatientService {
  private patientRepo = new PatientRepository();

  async getPatients(params: { page: number; limit: number }) {
    const { page, limit } = params;
    return this.patientRepo.listPatients({}, { page, limit });
  }

  async getPatientById(id: string) {
    const patient = await this.patientRepo.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient profile not found.');
    }
    return patient;
  }

  async getPatientByUserId(userId: string) {
    const patient = await this.patientRepo.findByUserId(userId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found.');
    }
    return patient;
  }
}
export default PatientService;
