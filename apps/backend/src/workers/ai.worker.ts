import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { redisConnection } from '../config/bullmq';
import MedicalDocumentModel from '../modules/lab/MedicalDocument.model';
import AIPredictionModel from '../modules/ai/AIPrediction.model';
import logger from '../utils/logger';
import storageProvider from '../modules/files/storage';

const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const aiWorker = new Worker(
  'ai-processing',
  async (job: Job) => {
    const { documentId } = job.data;
    logger.info(`AI Worker starting job ${job.id} for document: ${documentId}`);

    // 1. Fetch document
    const doc = await MedicalDocumentModel.findById(documentId);
    if (!doc) {
      logger.error(`Document ${documentId} not found in database. Aborting job.`);
      return;
    }

    // Initialize AIPrediction log
    const predictionLog = await AIPredictionModel.create({
      patientId: doc.patientId.toString(),
      documentId: doc._id.toString(),
      modelName: 'Pending',
      modelVersion: '1.0',
      confidence: 0,
      executionTimeMs: 0,
      prediction: 'Queued',
      status: 'PROCESSING'
    });

    try {
      const startTime = Date.now();

      if (doc.documentType === 'X_RAY') {
        // ----------------------------------------------------
        // X-RAY PIPELINE WITH GRAD-CAM VISUALIZATION OVERLAY
        // ----------------------------------------------------
        logger.info(`Running Chest X-Ray CNN classification on scan: ${doc.fileUrl}`);
        
        let fileBuffer: Buffer;
        
        // Load file buffer (local filesystem vs cloud download)
        if (doc.fileUrl.includes('/uploads/')) {
          const parts = doc.fileUrl.split('/uploads/');
          const relativePath = parts[1];
          const localPath = path.join(__dirname, '../../../public/uploads', relativePath);
          fileBuffer = fs.readFileSync(localPath);
        } else {
          const res = await axios.get(doc.fileUrl, { responseType: 'arraybuffer' });
          fileBuffer = Buffer.from(res.data);
        }

        // Post to FastAPI xray endpoint
        const formData = new FormData();
        const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
        formData.append('file', fileBlob, 'xray_scan.jpg');

        const aiResponse = await axios.post(`${aiServiceUrl}/api/v1/ai/xray`, formData, {
          responseType: 'arraybuffer',
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Retrieve metadata from response headers
        const metadataHeader = aiResponse.headers['x-model-prediction'];
        if (!metadataHeader) {
          throw new Error('X-Ray prediction headers missing from AI service response.');
        }
        
        const metadata = JSON.parse(metadataHeader);
        const gradcamBuffer = Buffer.from(aiResponse.data);

        // Upload Grad-CAM image back to storage provider
        const mockMulterFile: any = {
          originalname: 'gradcam_result.jpg',
          mimetype: 'image/jpeg',
          buffer: gradcamBuffer,
          size: gradcamBuffer.length
        };
        
        logger.info(`Uploading Grad-CAM heatmap visualization overlay...`);
        const gradcamUrl = await storageProvider.uploadFile(mockMulterFile, `patient-${doc.patientId}/gradcam`);

        // Update Document record with Grad-CAM visualization
        doc.summary = `Chest X-Ray visual analysis complete. Primary suspect: ${metadata.prediction}.`;
        doc.abnormalitiesHighlighted = metadata.abnormalitiesHighlighted;
        doc.fileUrl = gradcamUrl; // swap with Grad-CAM overlay
        await doc.save();

        // Update AIPrediction log
        predictionLog.modelName = metadata.model_name;
        predictionLog.modelVersion = metadata.model_version;
        predictionLog.confidence = metadata.confidence;
        predictionLog.prediction = metadata.prediction;
        predictionLog.rawOutput = metadata;
        predictionLog.executionTimeMs = Date.now() - startTime;
        predictionLog.status = 'COMPLETED';
        await predictionLog.save();

        logger.info(`Chest X-ray job ${job.id} completed. Prediction: ${metadata.prediction}`);

      } else {
        // ----------------------------------------------------
        // LAB REPORT SUMMARIZATION PIPELINE
        // ----------------------------------------------------
        logger.info(`Running Lab Report Summarization on document: ${doc.title}`);

        // Mock extracting the printed diagnostic content from report files
        const extractedText = (
          `Laboratory Report findings: Diagnostic testing for ${doc.title}. ` +
          `Patient serum chemistry results show elevated glucose levels at 160 mg/dL ` +
          `and high cholesterol levels at 245 mg/dL. Leukocytosis also indicated. ` +
          `Conclusion: Suggest cardiometabolic follow-up.`
        );

        // Call FastAPI summarizer
        const aiResponse = await axios.post(`${aiServiceUrl}/api/v1/ai/summarize`, {
          document_text: extractedText
        });

        const data = aiResponse.data;

        // Update Document record
        doc.summary = data.summary;
        doc.abnormalitiesHighlighted = data.abnormalitiesHighlighted;
        await doc.save();

        // Update AIPrediction log
        predictionLog.modelName = data.model_name;
        predictionLog.modelVersion = data.model_version;
        predictionLog.confidence = data.confidence;
        predictionLog.prediction = data.summary;
        predictionLog.rawOutput = data;
        predictionLog.executionTimeMs = Date.now() - startTime;
        predictionLog.status = 'COMPLETED';
        await predictionLog.save();

        logger.info(`Lab Report job ${job.id} completed. Extracted ${data.abnormalitiesHighlighted.length} abnormalities.`);
      }

    } catch (error: any) {
      logger.error(`AI Worker job ${job.id} failed:`, error.message);
      predictionLog.status = 'FAILED';
      predictionLog.prediction = `Error: ${error.message}`;
      await predictionLog.save();
      throw error;
    }
  },
  { connection: redisConnection }
);

logger.info('BullMQ AIBackgroundWorker initialized and listening for jobs.');
export default aiWorker;
