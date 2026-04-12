const request = require('supertest');
const app = require('../../index');
const { generateToken } = require('../../middleware/auth');

// Mock users
const adminUser = { id: 1, email: 'admin@test.com', nombre: 'Admin', apellido: 'User', rol: 'admin' };
const regularUser = { id: 2, email: 'user@test.com', nombre: 'User', apellido: 'Regular', rol: 'usuario' };

const adminToken = generateToken(adminUser);
const userToken = generateToken(regularUser);

describe('Migrations API', () => {
  describe('Authorization', () => {
    test('GET /api/migrations/list should return 401 without token', async () => {
      const res = await request(app).get('/api/migrations/list');
      expect(res.status).toBe(401);
    });

    test('GET /api/migrations/list should return 403 for non-admin user', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    test('GET /api/migrations/list should return 200 for admin', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/migrations/list', () => {
    test('should return versions array and currentVersion', async () => {
      const res = await request(app)
        .get('/api/migrations/list')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('versions');
      expect(res.body.data).toHaveProperty('currentVersion');
      expect(Array.isArray(res.body.data.versions)).toBe(true);
    });
  });

  describe('GET /api/migrations/history', () => {
    test('should return history array', async () => {
      const res = await request(app)
        .get('/api/migrations/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.history)).toBe(true);
    });
  });

  describe('GET /api/migrations/stats', () => {
    test('should return stats with currentVersion and tables', async () => {
      const res = await request(app)
        .get('/api/migrations/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('currentVersion');
      expect(res.body.data).toHaveProperty('tables');
      expect(Array.isArray(res.body.data.tables)).toBe(true);
    });
  });

  describe('GET /api/migrations/preview/:version/:direction', () => {
    test('should reject invalid direction', async () => {
      const res = await request(app)
        .get('/api/migrations/preview/1.0.0/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/migrations/execute', () => {
    test('should reject invalid direction', async () => {
      const res = await request(app)
        .post('/api/migrations/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ direction: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
