const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');

let app;

const testUser = {
  username: 'testuser_' + Date.now(),
  password: 'TestPass123!',
  name: 'Test User',
  contactNumber: '1234567890',
  shortBio: 'I am a test user.',
  location: { lat: 12.9716, long: 77.5946 }
};

describe('Auth Endpoints', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = 5001;
    app = require('../index');
  });

  afterAll(async () => {
    await User.deleteMany({ username: testUser.username });
    await mongoose.connection.close();
    delete process.env.NODE_ENV;
    delete process.env.PORT;
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/User registered successfully/);
  });

  it('should not register duplicate user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(409);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });
}); 