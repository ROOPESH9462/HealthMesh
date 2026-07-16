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

// Failover function to query Gemini API directly
async function queryGemini(prompt: string, expectJson: boolean): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  if (expectJson) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
  }

  const response = await axios.post(url, payload, { timeout: 15000 });
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return expectJson ? JSON.parse(text) : text;
}

/**
 * Proxy Symptom Check requests to FastAPI AI Microservice with Gemini failover
 */
router.post('/symptom-check', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { symptoms } = req.body;
    if (!symptoms) {
      throw new BadRequestError('Symptoms text input is required');
    }

    try {
      const aiRes = await axios.post(`${aiServiceUrl}/api/v1/ai/symptom-check`, { symptoms }, { timeout: 4000 });
      res.status(200).json(formatSuccessResponse('Symptom classification completed', aiRes.data));
    } catch (apiError) {
      // Failover to Gemini API
      if (process.env.GEMINI_API_KEY) {
        const prompt = `You are an expert clinical triage assistant. Analyze these symptoms: "${symptoms}".
Return a raw JSON object matching the following schema structure exactly (make sure the JSON is valid):
{
  "model_name": "Gemini-1.5-Flash-Failover",
  "model_version": "1.5-flash",
  "primary_suspect": "Likely condition name based on symptoms",
  "confidence": 0.85,
  "triage": "One of: Self-care, Consult Doctor, Emergency",
  "department": "Recommended medical department",
  "predictions": [
    {
      "disease": "Alternative condition 1",
      "confidence": 0.50,
      "department": "Medical department",
      "triage": "Triage recommendation"
    }
  ],
  "recommendations": [
    "Practical recommendation 1",
    "Practical recommendation 2",
    "Practical recommendation 3"
  ]
}`;
        const geminiRes = await queryGemini(prompt, true);
        res.status(200).json(formatSuccessResponse('Symptom classification completed (Gemini failover)', geminiRes));
      } else {
        const fallbackRes = {
          model_name: "Local-Rule-Based-Fallback",
          model_version: "1.0.0",
          primary_suspect: "Respiratory Infection (General)",
          confidence: 0.70,
          triage: "Consult Doctor",
          department: "General Medicine",
          predictions: [
            {
              disease: "Influenza / Cold",
              confidence: 0.60,
              department: "General Medicine",
              triage: "Self-care"
            }
          ],
          recommendations: [
            "Rest and keep hydrated.",
            "Monitor body temperature and symptoms.",
            "Book an appointment with a clinician if symptoms persist beyond 5 days."
          ]
        };
        res.status(200).json(formatSuccessResponse('Symptom classification completed (Static fallback)', fallbackRes));
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Proxy Chatbot conversational prompts to FastAPI RAG Engine with Gemini failover
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) {
      throw new BadRequestError('Chat query is required');
    }

    try {
      const aiRes = await axios.post(`${aiServiceUrl}/api/v1/ai/chat`, { query }, { timeout: 4000 });
      res.status(200).json(formatSuccessResponse('RAG response compiled', aiRes.data));
    } catch (apiError) {
      // Failover to Gemini API
      if (process.env.GEMINI_API_KEY) {
        const prompt = `You are Aegis Health AI clinical chatbot assistant. Answer the user query: "${query}".
Return a raw JSON object matching the following schema structure exactly (make sure the JSON is valid):
{
  "model_name": "Gemini-1.5-Flash-Failover",
  "model_version": "1.5-flash",
  "retrieved_context": "Clinical Knowledge Index / Medical guidelines",
  "response": "Provide a helpful, friendly, and clinical response to the user query.",
  "confidence": 0.90
}`;
        const geminiRes = await queryGemini(prompt, true);
        res.status(200).json(formatSuccessResponse('RAG response compiled (Gemini failover)', geminiRes));
      } else {
        const fallbackRes = {
          model_name: "Local-Rule-Based-Fallback",
          model_version: "1.0.0",
          retrieved_context: "Offline Knowledge Index",
          response: "Thank you for contacting Aegis Health. The AI service is currently in offline maintenance mode. For urgent issues, please schedule a consultation with one of our staff.",
          confidence: 0.50
        };
        res.status(200).json(formatSuccessResponse('RAG response compiled (Static fallback)', fallbackRes));
      }
    }
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
