import request from 'supertest'
import app from '../../app.mjs'
import dbPool from "../../config/database.mjs";
import RewardsRecord from "../../models/RewardsRecord.mjs";
import User from "../../models/User.mjs";
import crypto from "crypto";

async function createWithID({ recordID, userID, loyaltyProgramID, date, points,notified, rewardType, rewardAmount, statuscode, purpose }) {
    const query = `
            INSERT INTO RewardsRecord (recordID, Date, LoyaltyProgramID, UserID, Points, rewardType, rewardAmount, Statuscode, Purpose)
            VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)
        `;
    await dbPool.query(query, [recordID, date, loyaltyProgramID, userID, points, rewardType, rewardAmount, statuscode, purpose])
  }
async function getProgramId(loyaltyProgramName) {
const getProgramIdQuery = `
SELECT BIN_TO_UUID(programID) AS programID FROM loyaltyprogram WHERE name = ?
`;
const [resultProgramId] = await dbPool.query(getProgramIdQuery, [loyaltyProgramName]);
return resultProgramId[0].programID;
}

function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

describe ('RewardsRecord Integration Test', () => {
    let userJWT;
    let loyaltyProgramData;
    let programId;
    let imageData;
    let testUser;
    let testRewardModel;
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
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
        const res = await request(app)
        .post('/api/login')
        .send({ userName: "testuser", password: "testpassword" });
        userJWT = res.body.token;
        loyaltyProgramData = {
            name: 'Test Program',
            code:'TC',
            description: 'Description',
            category: 'TRAVEL',
            subcategory: 'HOTEL',
            currencyName: 'Points',
            currencyRate: 1.0,
            company: 'Test Company',
            enrollmentLink: 'http://test.com',
        };
        const loyaltyProgramValues = [
            loyaltyProgramData.name,
            loyaltyProgramData.code,
            loyaltyProgramData.description,
            loyaltyProgramData.category,
            loyaltyProgramData.subcategory,
            loyaltyProgramData.currencyName,
            loyaltyProgramData.currencyRate,
            loyaltyProgramData.company,
            loyaltyProgramData.enrollmentLink,
        ];
        const insertProgramQuery = `
            INSERT INTO LoyaltyProgram (name,code, description, category, subCategory, currencyName, currencyRate, company, enrollmentLink)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultProgram = await dbPool.query(insertProgramQuery, loyaltyProgramValues);
        const getProgramIdQuery = `
            SELECT programID As programID FROM LoyaltyProgram WHERE name = ?
        `
        const [resultId] = await dbPool.query(getProgramIdQuery,[loyaltyProgramData.name]);
        programId = resultId[0].programID
        const insertImageQuery = `
            INSERT INTO LoyaltyProgramImage (LoyaltyProgramID, image_data)
            VALUES (?, ?);
        `;
        imageData = Buffer.from(generateRandomBinaryString(16), 'utf8');
        const loyaltyImageData = [programId, imageData]
        const resultImage = await dbPool.query(insertImageQuery, loyaltyImageData);
        await dbPool.query(`INSERT INTO statuscode (code, description) VALUES
            ('0000', 'success'),
                ('0001', 'member not found'),
                ('0002', 'member name mismatch'),
                ('0003', 'member account closed'),
                ('0004', 'member account suspended'),
                ('0005', 'member ineligible for accrual'),
                ('0006', 'submitted'),
                ('0007', 'processing'),
                ('0099', 'unable to process, please contact support for more information');
                `)
        testRewardModel = {
            recordID: crypto.randomUUID(),
            date: new Date("2024-01-01"),
            loyaltyProgramID: await getProgramId('Test Program'),
            userID: testUser.userID,
            points: 0,
            rewardType: 'testreward',
            rewardAmount: 5000,
            statuscode: '0006',
            purpose: 'testReward',
            }
        await createWithID(testRewardModel);
         
    });
    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });

    test('POST /rewardsrecords with valid data should create a rewards record', async () => {
        const rewardData = {
          loyaltyProgramName: 'Test Program',
          points: 100,
          purpose: 'Test Purpose'
        };
    
        const res = await request(app)
          .post('/rewardsrecords')
          .set('Authorization', `Bearer ${userJWT}`)
          .send(rewardData);
    
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('userID');
        expect(res.body).toHaveProperty('loyaltyProgramID');
        expect(res.body).toHaveProperty('points', rewardData.points);
        expect(res.body).toHaveProperty('rewardAmount', rewardData.points * loyaltyProgramData.currencyRate);
        expect(res.body).toHaveProperty('rewardType', loyaltyProgramData.currencyName);
        expect(res.body).toHaveProperty('purpose', rewardData.purpose);
      });

      test('POST /rewardsrecords with non-existent loyalty program should return 404', async () => {
        const rewardData = {
          loyaltyProgramName: 'NonExistentProgram',
          points: 100,
          purpose: 'Test Purpose'
        };
    
        const res = await request(app)
          .post('/rewardsrecords')
          .set('Authorization', `Bearer ${userJWT}`)
          .send(rewardData);
    
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'LoyaltyProgram not found');
      });

      test('POST /rewardsrecords with invalid token should return 401', async () => {
        const rewardData = {
          loyaltyProgramName: 'Test Program',
          points: 100,
          purpose: 'Test Purpose'
        };
    
        const res = await request(app)
          .post('/rewardsrecords')
          .set('Authorization', 'Bearer invalidtoken')
          .send(rewardData);
    
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid token');
      });

      test('POST /rewardsrecords without token should return 401', async () => {
        const rewardData = {
          loyaltyProgramName: 'Test Program',
          points: 100,
          purpose: 'Test Purpose'
        };
    
        const res = await request(app)
          .post('/rewardsrecords')
          .send(rewardData);
    
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
      });


  test('GET /rewardsrecords/:recordID with valid ID should return the rewards record', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/${testRewardModel.recordID}`)
      .set('Authorization', `Bearer ${userJWT}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recordID', testRewardModel.recordID);
    expect(res.body).toHaveProperty('points', 0);
    expect(res.body).toHaveProperty('rewardType', 'testreward');
    expect(res.body).toHaveProperty('rewardAmount', 5000);
    expect(res.body).toHaveProperty('purpose', 'testReward');
  });

  test('GET /rewardsrecords/:recordID with non-existent ID should return 404', async () => {
    const nonExistentID = crypto.randomUUID();
    const res = await request(app)
      .get(`/rewardsrecords/${nonExistentID}`)
      .set('Authorization', `Bearer ${userJWT}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Record not found');
  });

  test('GET /rewardsrecords/:recordID with invalid token should return 401', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/${testRewardModel.recordID}`)
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('GET /rewardsrecords/:recordID without token should return 401', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/${testRewardModel.recordID}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });

  test('GET /rewardsrecords/user/:userID with valid userID should return the rewards record', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/user/${testUser.userID}`)
      .set('Authorization', `Bearer ${userJWT}`);
    res.body.forEach(record => {
        expect(record).toHaveProperty('points');
        expect(record).toHaveProperty('rewardType');
        expect(record).toHaveProperty('userID');
        expect(record).toHaveProperty('rewardAmount');
        expect(record).toHaveProperty('purpose');
        expect(record).toHaveProperty('statuscode');
        expect(record).toHaveProperty('loyaltyProgramID');
        expect(record).toHaveProperty('notified');

    });
  });
  test('GET /rewardsrecords/user/:userID with invalid token should return 401', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/user/${testUser.userID}`)
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('GET /rewardsrecords/user/:userID without token should return 401', async () => {
    const res = await request(app)
      .get(`/rewardsrecords/user/${testUser.userID}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });
  test('PUT /rewardsrecords/:recordID/status with valid recordID and status should update the status', async () => {
    const res = await request(app)
      .put(`/rewardsrecords/${testRewardModel.recordID}/status`)
      .set('Authorization', `Bearer ${userJWT}`)
      .send({ status: '0007' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Status updated successfully');
  });

  test('PUT /rewardsrecords/:recordID/status with invalid token should return 401', async () => {
    const res = await request(app)
      .put(`/rewardsrecords/${testRewardModel.recordID}/status`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ status: '0007' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('PUT /rewardsrecords/:recordID/status without token should return 401', async () => {
    const res = await request(app)
      .put(`/rewardsrecords/${testRewardModel.recordID}/status`)
      .send({ status: '0007' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });
  test('PUT /updateNotif with valid recordID should update the notification status', async () => {
    const res = await request(app)
      .put(`/updateNotif`)
      .set('Authorization', `Bearer ${userJWT}`)
      .send({ recordID: testRewardModel.recordID });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Notif updated successfully');
  });
  test('PUT /updateNotif with invalid token should return 401', async () => {
    const res = await request(app)
      .put(`/updateNotif`)
      .set('Authorization', 'Bearer invalidtoken')
      .send({ recordID: testRewardModel.recordID });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('PUT /updateNotif without token should return 401', async () => {
    const res = await request(app)
      .put(`/updateNotif`)
      .send({ recordID: testRewardModel.recordID });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });
    
});