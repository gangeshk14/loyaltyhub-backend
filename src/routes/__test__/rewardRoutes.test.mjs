import request from 'supertest'
import app from '../../app.mjs'

describe ('RewardsRecord Requests', () => {
    let token;
    let recordID;
    let userID;

    beforeAll(async () => {
        const response = await request(app).post('/api/login').send({
            userName: 'testUser',
            password: 'P@ssword123',
        });
        token = response.body.token;

        const userDetails = request(app).get('/profile');
        userID = response.body.userID;
    });

    describe ('POST /rewardsrecords', () => {
        it('should create new reward record', async () => {
            const response = await request(app).post('/rewardsrecords').set('Authorisation', `Bearer ${token}`).send({
                loyaltyProgramID: 'lp123', // requires update
                points: 100,
                status: 'REJECTED',
                purpose: 'test purpose'
            })
                // .expect(201);
        });
    });

    describe ('GET /rewardsrecords/:recordID', () => {
        it('should get reward record from id', async () => {
            const response = await request(app).get(`/rewardsrecords/${recordID}`).set('Authorisation', `Bearer ${token}`)
                // .expect(response.body).toHaveProperty('id', recordID)
                // .expect(response.status).toBe(200);
        });
    });

    describe ('GET /rewardsrecords/user/:userID', () => {
        it('should get reward record from userID', async () => {
            // const response = await request(app).get(`/rewardsrecords/user/${userID}`).set('Authorisation', `Bearer ${token}`)
                // .expect(response.body).toHaveProperty('id', recordID)
                // .expect(response.status).toBe(200);
        });
    });

    describe ('PUT /rewardsrecords/:recordID/status', () => {
        it('should update reward record status', async () => {
            const response = await request(app).put(`/rewardsrecords/${recordID}/status`).set('Authorisation', `Bearer ${token}`).send({
                status: 'SUCCESSFUL'
            })
            // .expect(response.status).toBe(200)
            // .expect(response.body).toHaveProperty('status', 'REJECTED')
        });
    });
    
});