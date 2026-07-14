import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { protect } from '../../middleware/auth.middleware';
import AIPredictionModel from './AIPrediction.model';
import PatientModel from '../patient/Patient.model';
import { formatSuccessResponse, NotFoundError, BadRequestError } from '@healthcare/shared-utils';
import { UserRole } from '@healthcare/shared-types';

const router = Router();
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Apply auth middleware to all AI routes
router.use(protect);

/**
 * Proxy Symptom Check requests to FastAPI AI Microservice
 */
router.post('/symptom-check', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) {
      throw new BadRequestError('Symptoms text input is required');
    }

    const aiRes = await axios.post(`${aiServiceUrl}/api/v1/ai/symptom-check`, { symptoms });
    res.status(200).json(formatSuccessResponse('Symptom classification completed', aiRes.data));
  } catch (error) {
    next(error);
  }
});

/**
 * Proxy Chatbot conversational prompts to FastAPI RAG Engine
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) {
      throw new BadRequestError('Chat query is required');
    }

    const aiRes = await axios.post(`${aiServiceUrl}/api/v1/ai/chat`, { query });
    res.status(200).json(formatSuccessResponse('RAG response compiled', aiRes.data));
  } catch (error) {
    next(error);
  }
});

/**
 * List AI predictions history
 */
router.get('/predictions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const filter: Record<string, any> = {};

    if (user.role === UserRole.PATIENT) {
      const patient = await PatientModel.findOne({ userId: user.id }).exec();
      if (!patient) {
        throw new NotFoundError('Patient profile not found');
      }
      filter.patientId = patient._id;
    } else if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const predictions = await AIPredictionModel.find(filter)
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json(formatSuccessResponse('AI predictions history retrieved', predictions));
  } catch (error) {
    next(error);
  }
});

/**
 * Get details of a single prediction
 */
router.get('/predictions/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const prediction = await AIPredictionModel.findById(req.params.id)
      .populate({
        path: 'patientId',
        select: 'userId dateOfBirth gender',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .exec();

    if (!prediction) {
      throw new NotFoundError('AI prediction log not found');
    }

    // Verify patient access ownership
    if (user.role === UserRole.PATIENT) {
      const patient = await PatientModel.findOne({ userId: user.id }).exec();
      if (!patient || prediction.patientId._id.toString() !== patient._id.toString()) {
        throw new BadRequestError('Unauthorized to access this AI prediction record');
      }
    }

    res.status(200).json(formatSuccessResponse('AI prediction details', prediction));
  } catch (error) {
    next(error);
  }
});

export default router;
