import request from 'supertest';
import app from '../../app.mjs'; // Assuming your Express app instance is exported from 'app.js'
import dbPool from '../../config/database.mjs'; // Import your database connection

describe('User Routes', () => {
    test('GET /api/users should call getUsers', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(404);
    });
});

