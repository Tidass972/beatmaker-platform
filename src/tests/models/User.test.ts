import mongoose from 'mongoose';
import { User } from '../../models/User';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('User Model Test', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('should create & save user successfully', async () => {
    const validUser = new User({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'producer'
    });
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(validUser.username);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.role).toBe(validUser.role);
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ username: 'test' });
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should hash password before saving', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'customer'
    });
    
    await user.save();
    expect(user.password).not.toBe('password123');
  });

  it('should correctly compare passwords', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'customer'
    });
    
    await user.save();
    
    const isMatch = await user.comparePassword('password123');
    const isNotMatch = await user.comparePassword('wrongpassword');
    
    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });
});
