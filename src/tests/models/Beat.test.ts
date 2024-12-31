import mongoose from 'mongoose';
import { Beat } from '../../models/Beat';
import { User } from '../../models/User';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Beat Model Test', () => {
  let mongoServer: MongoMemoryServer;
  let producer: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Créer un producteur pour les tests
    producer = await User.create({
      username: 'producer',
      email: 'producer@test.com',
      password: 'password123',
      role: 'producer'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Beat.deleteMany({});
  });

  it('should create & save beat successfully', async () => {
    const validBeat = new Beat({
      title: 'Test Beat',
      producer: producer._id,
      genre: ['Hip Hop'],
      bpm: 140,
      price: 29.99,
      audioFile: 'path/to/audio.mp3',
      duration: 180
    });

    const savedBeat = await validBeat.save();
    
    expect(savedBeat._id).toBeDefined();
    expect(savedBeat.title).toBe(validBeat.title);
    expect(savedBeat.producer.toString()).toBe(producer._id.toString());
    expect(savedBeat.plays).toBe(0);
    expect(savedBeat.likes).toBe(0);
  });

  it('should fail to save beat without required fields', async () => {
    const beatWithoutRequiredField = new Beat({
      title: 'Test Beat'
    });
    
    let err;
    try {
      await beatWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should correctly format duration', async () => {
    const beat = new Beat({
      title: 'Test Beat',
      producer: producer._id,
      genre: ['Hip Hop'],
      bpm: 140,
      price: 29.99,
      audioFile: 'path/to/audio.mp3',
      duration: 185 // 3:05
    });

    await beat.save();
    expect(beat.get('formattedDuration')).toBe('3:05');
  });

  it('should not allow negative values for numeric fields', async () => {
    const beatWithNegativeValues = new Beat({
      title: 'Test Beat',
      producer: producer._id,
      genre: ['Hip Hop'],
      bpm: -140,
      price: -29.99,
      audioFile: 'path/to/audio.mp3',
      duration: -180
    });

    let err;
    try {
      await beatWithNegativeValues.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });
});
