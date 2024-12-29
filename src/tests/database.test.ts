import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';

describe('Database Configuration', () => {
  beforeAll(async () => {
    // Utiliser une base de données de test
    process.env.MONGODB_URI = 'mongodb://localhost:27017/beatmaker_test';
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should connect to MongoDB successfully', async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should handle connection errors gracefully', async () => {
    // Forcer une erreur en utilisant une URI invalide
    process.env.MONGODB_URI = 'mongodb://invalid:27017/beatmaker_test';
    await expect(connectDB()).rejects.toThrow();
  });

  it('should disconnect from MongoDB successfully', async () => {
    await connectDB();
    await disconnectDB();
    expect(mongoose.connection.readyState).toBe(0);
  });
});
