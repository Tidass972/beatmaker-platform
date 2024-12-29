import request from 'supertest';
import { app } from '../server';

describe('Server Configuration', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should handle 404 errors', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });

  it('should handle CORS', async () => {
    const response = await request(app).options('/api/health');
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});
