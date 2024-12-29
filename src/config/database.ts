import mongoose from 'mongoose';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/beatmaker';
    
    await mongoose.connect(mongoUri, {
      // Ces options sont recommandées par MongoDB
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Successfully connected to MongoDB.');
    
    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Gestion gracieuse de la fermeture
    process.on('SIGINT', async () => {
      await disconnectDB();
      process.exit(0);
    });

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Successfully disconnected from MongoDB.');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};
