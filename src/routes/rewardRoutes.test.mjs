import request from 'supertest'
import app from '../app.mjs'

describe ('RewardsRecord Requests', () => {
    let token;
    let recordID;

    beforeAll(async () => {
        const response = await request(app).post('/api/login').send({
            userName: 'testUser',
            password: 'P@ssword123',
        });
        token = response.body.token;
    });

describe ('POST /rewardsrecords', () => {
    it('should create new reward record', async () => {
        const response = await request(app).post('/rewardsrecords').set('Authorisation', `Bearer ${token}`).send({
            //
        })
    })
})

})