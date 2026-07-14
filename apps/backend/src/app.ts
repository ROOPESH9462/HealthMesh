import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { redisClient } from './config/redis';
import axios from 'axios';
const xss = require('xss-clean'); // No type definitions available, import as commonjs module

import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import authRouter from './modules/auth/auth.routes';
import appointmentRouter from './modules/appointment/appointment.routes';
import doctorRouter from './modules/doctor/doctor.routes';
import patientRouter from './modules/patient/patient.routes';
import prescriptionRouter from './modules/appointment/prescription.routes';
import billRouter from './modules/billing/bill.routes';
import pharmacyRouter from './modules/pharmacy/pharmacy.routes';
import labRouter from './modules/lab/lab.routes';
import aiRouter from './modules/ai/ai.routes';
import consultationRouter from './modules/appointment/consultation.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import { formatSuccessResponse, NotFoundError } from '@healthcare/shared-utils';

const app = express();

// Set security HTTP headers (with customized CSP if needed)
app.use(helmet());

// Enable CORS
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
}));

// Parse cookies
app.use(cookieParser());

// Body parser, reading data from body into req.body, limit 10mb for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Serve static uploads for local file development fallback
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Request logging tracing
app.use(requestLogger);

// Base health check: aggregate status of database, redis, AI, and storage
app.get('/api/v1/health', async (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = redisClient.isOpen;
  
  let aiConnected = false;
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.get(aiUrl, { timeout: 1000 });
    aiConnected = response.status === 200;
  } catch (err) {
    aiConnected = false;
  }

  const isCloudStorage = !!process.env.CLOUDINARY_CLOUD_NAME;
  const storageStatus = isCloudStorage ? 'cloudinary' : 'local';

  const isHealthy = dbConnected && redisConnected && aiConnected;

  res.status(isHealthy ? 200 : 503).json(
    formatSuccessResponse(isHealthy ? 'System status: Healthy' : 'System status: Degraded', {
      status: isHealthy ? 'Healthy' : 'Degraded',
      timestamp: new Date(),
      uptime: process.uptime(),
      checks: {
        database: dbConnected ? 'UP' : 'DOWN',
        redis: redisConnected ? 'UP' : 'DOWN',
        aiService: aiConnected ? 'UP' : 'DOWN',
        storage: storageStatus
      }
    })
  );
});

// Database check
app.get('/api/v1/health/database', (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const isHealthy = readyState === 1;
  res.status(isHealthy ? 200 : 503).json(
    formatSuccessResponse(`Database status: ${states[readyState]}`, {
      status: states[readyState],
      readyState
    })
  );
});

// Redis check
app.get('/api/v1/health/redis', (_req, res) => {
  const isOpen = redisClient.isOpen;
  res.status(isOpen ? 200 : 503).json(
    formatSuccessResponse(isOpen ? 'Redis status: connected' : 'Redis status: disconnected', {
      status: isOpen ? 'connected' : 'disconnected'
    })
  );
});

// AI Service check
app.get('/api/v1/health/ai', async (_req, res) => {
  try {
    const aiUrl = (process.env.AI_SERVICE_URL || 'http://localhost:8000') + '/health';
    const response = await axios.get(aiUrl, { timeout: 2000 });
    res.status(200).json(
      formatSuccessResponse('AI Service status: connected', response.data)
    );
  } catch (err: any) {
    res.status(503).json(
      formatSuccessResponse('AI Service status: offline', {
        error: err.message
      })
    );
  }
});

// Storage check
app.get('/api/v1/health/storage', (_req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isCloudStorage = !!cloudName;
  res.status(200).json(
    formatSuccessResponse(
      isCloudStorage ? 'Storage status: Cloudinary active' : 'Storage status: Local filesystem active',
      {
        provider: isCloudStorage ? 'cloudinary' : 'local',
        cloudName: cloudName || 'N/A'
      }
    )
  );
});

// Route Mountings
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/billing', billRouter);
app.use('/api/v1/pharmacy', pharmacyRouter);
app.use('/api/v1/lab', labRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/consultations', consultationRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Catch-all for unhandled routes
app.all('*', (req, _res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handling middleware
app.use(errorHandler);

export default app;
