import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

// Handle uncaught exceptions before loading other modules
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Load environment variables from workspace root
dotenv.config({ path: '../../.env' });

import { validateEnvOnStartup } from './config/env';
validateEnvOnStartup();

import app from './app';
import { connectDB, disconnectDB } from './config/db';
import { connectRedis } from './config/redis';
import logger from './utils/logger';
import './workers/ai.worker';

const port = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io Server
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO JWT Authentication Middleware
import jwt from 'jsonwebtoken';
import ConsultationModel from './modules/appointment/Consultation.model';
import AppointmentModel from './modules/appointment/Appointment.model';

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token is required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production') as any;
    (socket as any).user = decoded;
    next();
  } catch (err) {
    return next(new Error('Invalid token. Socket authentication failed.'));
  }
});

// Real-Time signaling and chat broker
io.on('connection', (socket) => {
  const user = (socket as any).user;
  logger.info(`Authenticated client connected: ${socket.id} (User: ${user.id}, Role: ${user.role})`);

  socket.on('join-consultation-room', async ({ appointmentId }) => {
    const roomName = `appointment:${appointmentId}`;
    
    try {
      const appt = await AppointmentModel.findById(appointmentId).exec();
      if (!appt) {
        socket.emit('error-notice', 'Appointment room does not exist');
        return;
      }
      
      logger.info(`User ${user.id} joined consultation session room: ${roomName}`);
      socket.join(roomName);
      
      // Notify other room participants
      socket.to(roomName).emit('participant-joined', { userId: user.id, role: user.role });
    } catch (e: any) {
      socket.emit('error-notice', `Failed to join room: ${e.message}`);
    }
  });

  // Relay WebRTC Handshakes
  socket.on('webrtc-offer', ({ appointmentId, offer }) => {
    const roomName = `appointment:${appointmentId}`;
    socket.to(roomName).emit('webrtc-offer', { offer });
  });

  socket.on('webrtc-answer', ({ appointmentId, answer }) => {
    const roomName = `appointment:${appointmentId}`;
    socket.to(roomName).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice-candidate', ({ appointmentId, candidate }) => {
    const roomName = `appointment:${appointmentId}`;
    socket.to(roomName).emit('webrtc-ice-candidate', { candidate });
  });

  // Live Chat persistence
  socket.on('chat-message', async ({ appointmentId, text, senderName }) => {
    const roomName = `appointment:${appointmentId}`;
    
    try {
      const msg = { senderName, text, timestamp: new Date() };
      await ConsultationModel.findOneAndUpdate(
        { appointmentId },
        { $push: { messages: msg } }
      ).exec();
      
      io.to(roomName).emit('chat-message', msg);
    } catch (e: any) {
      logger.error(`Failed to log consultation chat message: ${e.message}`);
    }
  });

  socket.on('typing', ({ appointmentId, isTyping }) => {
    const roomName = `appointment:${appointmentId}`;
    socket.to(roomName).emit('typing', { userId: user.id, isTyping });
  });

  socket.on('end-consultation-call', ({ appointmentId }) => {
    const roomName = `appointment:${appointmentId}`;
    socket.to(roomName).emit('consultation-ended');
    logger.info(`Doctor terminated call session in room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  // Connect to Database & Cache
  await connectDB();
  await connectRedis();

  server.listen(port, () => {
    logger.info(`Server gateway is running on port ${port} in ${process.env.NODE_ENV} mode.`);
  });
}

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err: any) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    disconnectDB().then(() => {
      process.exit(1);
    });
  });
});

// Handle SIGTERM signals
process.on('SIGTERM', () => {
  logger.warn('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    disconnectDB().then(() => {
      logger.info('Process terminated.');
    });
  });
});
