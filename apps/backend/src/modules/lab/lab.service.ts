import LabRepository from './lab.repository';
import storageProvider from '../files/storage';
import { aiQueue } from '../../config/bullmq';
import { NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { UserRole } from '@healthcare/shared-types';
import logger from '../../utils/logger';

export class LabService {
  private labRepo = new LabRepository();

  /**
   * Upload a lab report file, get secure URL from storage provider, and register Document
   */
  async uploadReport(params: {
    patientId: string;
    documentType: string;
    title: string;
    file: Express.Multer.File;
    userId: string;
    role: string;
  }) {
    if (!params.file) {
      throw new BadRequestError('Lab report file attachment is required');
    }

    // 1. Upload file using active storage provider
    logger.info(`Uploading lab report file to storage bucket. Folder: patient-${params.patientId}`);
    const fileUrl = await storageProvider.uploadFile(params.file, `patient-${params.patientId}`);

    // 2. Register Document details
    const doc = await this.labRepo.createDocument({
      patientId: params.patientId,
      documentType: params.documentType,
      title: params.title,
      fileUrl,
      isVerifiedByDoctor: false,
    });

    // 3. Queue for background AI processing
    logger.info(`Lab report registered successfully: ${doc.id}. Queueing job for background AI diagnostic processing.`);
    try {
      await aiQueue.add('process-document', { documentId: doc.id });
    } catch (e: any) {
      logger.error(`Failed to queue AI processing job for document ${doc.id}:`, e.message);
    }
    
    return doc;
  }

  /**
   * List lab reports with filter bounds
   */
  async getDocuments(params: {
    userId: string;
    role: string;
    page: number;
    limit: number;
    patientId?: string;
    documentType?: string;
  }) {
    const filter: Record<string, any> = {};

    if (params.documentType) {
      filter.documentType = params.documentType;
    }

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

    return this.labRepo.listDocuments(filter, { page: params.page, limit: params.limit });
  }

  /**
   * Get single document, verifying permissions
   */
  async getDocumentById(id: string, userId: string, role: string) {
    const doc = await this.labRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Medical document report not found');
    }

    if (role === UserRole.PATIENT) {
      const PatientModel = require('../patient/Patient.model').default;
      const patient = await PatientModel.findOne({ userId }).exec();
      if (!patient || doc.patientId._id.toString() !== patient._id.toString()) {
        throw new BadRequestError('Unauthorized access to this medical document');
      }
    }

    return doc;
  }

  /**
   * Clinician sign off / verification signature
   */
  async verifyReport(id: string, userId: string) {
    const DoctorModel = require('../doctor/Doctor.model').default;
    const doctor = await DoctorModel.findOne({ userId }).exec();
    if (!doctor) {
      throw new NotFoundError('Doctor profile not found. Only registered doctors can verify reports.');
    }

    const doc = await this.labRepo.verifyReport(id, doctor._id.toString());
    if (!doc) {
      throw new NotFoundError('Medical report not found');
    }

    logger.info(`Medical document ${id} verified and signed by Dr. ${doctor._id.toString()}`);
    return doc;
  }

  /**
   * Delete report, cleaning up storage assets
   */
  async deleteReport(id: string, userId: string, role: string) {
    const doc = await this.labRepo.findById(id);
    if (!doc) {
      throw new NotFoundError('Medical document report not found');
    }

    // Auth check
    logger.info(`User ${userId} requested deletion of report ${id}`);
    if (role !== UserRole.ADMIN && role !== UserRole.RECEPTIONIST) {
      throw new BadRequestError('Only laboratory staff and admins can delete document files');
    }

    // 1. Delete file from storage
    logger.info(`Deleting file from storage: ${doc.fileUrl}`);
    await storageProvider.deleteFile(doc.fileUrl);

    // 2. Remove database record
    await this.labRepo.deleteDocument(id);

    logger.info(`Successfully deleted laboratory report ${id}`);
    return doc;
  }
}
export default LabService;
