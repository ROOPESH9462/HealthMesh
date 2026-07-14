import mongoose from 'mongoose';
import logger from '../utils/logger';

export async function connectDB(): Promise<void> {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-healthcare';

  try {
    mongoose.connection.on('connected', () => {
      logger.info('Successfully connected to MongoDB.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Retrying connection...');
    });

    await mongoose.connect(mongoURI, {
      autoIndex: true, // Auto-create indexes in development (production will be handled via migrations or pre-seeded scripts)
    });
  } catch (error) {
    logger.error('Failed to initialize MongoDB connection:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed.');
  } catch (error) {
    logger.error('Error during MongoDB disconnection:', error);
  }
}
