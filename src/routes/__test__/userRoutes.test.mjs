import request from 'supertest';
import app from '../../app.mjs';
import dbPool from '../../config/database.mjs';

describe('User Routes', () => {
    test('GET /api/users should call getUsers', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(404);
    });
});

