import request from 'supertest';
import app from '../../app.mjs';
import dbPool from '../../config/database.mjs';
import User from '../../models/User.mjs';

describe('User Routes', () => {
    let testUser;
    beforeAll(async () => {
        // Create a test user in the database
        const userData = {
            userName: "testuser",
            password: "testpassword",
            firstName: "Test",
            lastName: "User",
            membershipType: "",
            mobileNumber: "1234567890",
            email: "testuser@example.com"
        };
        testUser = await User.create(userData);
    });
    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });
    let userJWT;

    test('POST /api/login with correct credentials should return a token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ userName: "testuser", password: "testpassword" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        userJWT = res.body.token;
    });
    test('POST /api/login with incorrect username should return 404', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ userName: "wronguser", password: "testpassword" });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });
    test('POST /api/login with incorrect password should return 401', async () => {
        const res = await request(app)
            .post('/api/login')
            .send({ userName: "testuser", password: "wrongpassword" });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid password');
    });
    test('GET /profile with valid token should return user profile', async () => {
        const res = await request(app)
            .get('/profile')
            .set('Authorization', `Bearer ${userJWT}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('userID', testUser.userID);
        expect(res.body).toHaveProperty('userName', testUser.userName);
        expect(res.body).toHaveProperty('mobileNumber', testUser.mobileNumber);
        expect(res.body).toHaveProperty('email', testUser.email);
    });
    test('PUT /updateprofile with valid token should update user profile', async () => {
        const updatedData = {
            userName: "updateduser",
            mobileNumber: "0987654321",
            email: "updateduser@example.com"
        };

        const res = await request(app)
            .put('/updateprofile')
            .set('Authorization', `Bearer ${userJWT}`)
            .send(updatedData);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('userName', updatedData.userName);
        expect(res.body).toHaveProperty('mobileNumber', updatedData.mobileNumber);
        expect(res.body).toHaveProperty('email', updatedData.email);

        const user = await User.findById(testUser.userID);
        expect(user.userName).toBe(updatedData.userName);
        expect(user.mobileNumber).toBe(updatedData.mobileNumber);
        expect(user.email).toBe(updatedData.email);
    });
    test('PUT /updateprofile with invalid token should return 401', async () => {
        const updatedData = {
            userName: "updateduser",
            mobileNumber: "0987654321",
            email: "updateduser@example.com"
        };

        const res = await request(app)
            .put('/updateprofile')
            .set('Authorization', 'Bearer invalidtoken')
            .send(updatedData);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    test('PUT /updateprofile without token should return 401', async () => {
        const updatedData = {
            userName: "updateduser",
            mobileNumber: "0987654321",
            email: "updateduser@example.com"
        };

        const res = await request(app)
            .put('/updateprofile')
            .send(updatedData);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });
    
});

