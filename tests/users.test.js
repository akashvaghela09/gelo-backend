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

let token;

describe('User Profile & Nearby Users', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = 5001;
    app = require('../index');
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send({ username: testUser.username, password: testUser.password });
    token = res.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ username: testUser.username });
    await mongoose.connection.close();
    delete process.env.NODE_ENV;
    delete process.env.PORT;
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', contactNumber: '1112223333', shortBio: 'Updated bio.' });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  it('should fetch nearby users by GPS', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .query({ latitude: 12.9716, longitude: 77.5946 });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('should fetch nearby users by Bluetooth', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .query({ bluetoothId: 'FAKE_BT_123456' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
}); 