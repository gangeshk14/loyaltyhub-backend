import request from 'supertest'
import app from '../../app.mjs'

describe ('VerifiedMembershipsRoutes', () => {
    let token;
    let userID;

    beforeAll(async() => {

        await request(app).post('/api/register').send({
            userName: 'testUser',
            password: 'P@ssword123',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@test.com',
            membershipType: 'Silver',
            mobileNumber: '1234567890'
        })

        const response = await request(app).post('/api/login').send({
            userName: 'testUser',
            password: 'P@ssword123',
        });

        token = response.body.token;
        const userDetails = request(app).get('/profile');
        userID = response.body.userID;
    })
})