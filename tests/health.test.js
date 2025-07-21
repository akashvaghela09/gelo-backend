const request = require('supertest');

let app;

describe('Health Check', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = 5001;
    app = require('../index');
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
  });

  it('should return backend running status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toMatch(/Backend is running/);
  });
}); 