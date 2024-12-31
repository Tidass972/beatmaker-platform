import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../config/database';

describe('Database Configuration', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // S'assurer que la connexion est fermée avant chaque test
    await mongoose.disconnect();
  });

  it('should connect to MongoDB successfully', async () => {
    await connectDB();
    expect(mongoose.connection.readyState).toBe(1);
  }, 10000); // Augmenter le timeout à 10 secondes

  it('should disconnect from MongoDB successfully', async () => {
    await connectDB();
    await disconnectDB();
    expect(mongoose.connection.readyState).toBe(0);
  }, 10000); // Augmenter le timeout à 10 secondes

  it('should handle connection errors gracefully', async () => {
    // Simuler une erreur de connexion en utilisant une URI invalide
    process.env.MONGODB_URI = 'mongodb://invalid:27017/test';
    await expect(connectDB()).rejects.toThrow();
  }, 10000);
});
