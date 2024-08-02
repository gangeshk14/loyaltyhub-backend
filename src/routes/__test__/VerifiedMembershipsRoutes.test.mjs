import request from 'supertest'
import app from '../../app.mjs'
import User from "../../models/User.mjs";
import dbPool from "../../config/database.mjs";
import crypto from "crypto";

function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
describe ('VerifiedMembershipsRoutes', () => {
    let userJWT;
    let testUser;
    let programId;
    let loyaltyProgramData;
    beforeAll(async() => {
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
        const imageData = Buffer.from(generateRandomBinaryString(16), 'utf8');
        const loyaltyImageData = [programId, imageData]
        const resultImage = await dbPool.query(insertImageQuery, loyaltyImageData);
    });

    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });
    test('POST /verifiedmemberships/add with valid data should add a verified membership', async () => {
        const res = await request(app)
          .post('/verifiedmemberships/add')
          .set('Authorization', `Bearer ${userJWT}`)
          .send({
            loyaltyProgramName: loyaltyProgramData.name,
            membershipID: "MA-12345"
          });
          expect(res.status).toBe(201);
          expect(res.body).toHaveProperty('userID');
          expect(res.body).toHaveProperty('loyaltyProgramID');
          expect(res.body).toHaveProperty('membershipID', "MA-12345");
    })
    test('POST /verifiedmemberships/add with existing membership should return 200 and indicate already verified', async () => {
        const res = await request(app)
          .post('/verifiedmemberships/add')
          .set('Authorization', `Bearer ${userJWT}`)
          .send({
            loyaltyProgramName: loyaltyProgramData.name,
            membershipID: "MA-12345"
          });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Membership already verified');
      });


  test('POST /verifiedmemberships/add with invalid token should return 401', async () => {
    const res = await request(app)
      .post('/verifiedmemberships/add')
      .set('Authorization', 'Bearer invalidtoken')
      .send({
            loyaltyProgramName: loyaltyProgramData.name,
            membershipID: "MA-12345"
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('POST /verifiedmemberships/add without token should return 401', async () => {
    const res = await request(app)
      .post('/verifiedmemberships/add')
      .send({
            loyaltyProgramName: loyaltyProgramData.name,
            membershipID: "MA-12345"
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });

  test('POST /verifiedmemberships/add with non-existent loyalty program should return 500', async () => {
    const res = await request(app)
      .post('/verifiedmemberships/add')
      .set('Authorization', `Bearer ${userJWT}`)
      .send({
        loyaltyProgramName: 'NonExistentProgram',
        membershipID: 'NONEXISTENT12345'
      });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to add verified membership');
  });

  test('GET /verifiedmemberships/user/:userID with valid user ID should return verified memberships', async () => {
    const res = await request(app)
      .get(`/verifiedmemberships/user/${testUser.userID}`)
      .set('Authorization', `Bearer ${userJWT}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('userID', testUser.userID);
    expect(res.body[0]).toHaveProperty('loyaltyProgramID');
    expect(res.body[0]).toHaveProperty('membershipID',  "MA-12345");
  });
  test('GET /verifiedmemberships/user/:userID with non-existent user ID should return 404', async () => {
    const nonExistentID = crypto.randomUUID();
    const res = await request(app)
      .get(`/verifiedmemberships/user/${nonExistentID}`)
      .set('Authorization', `Bearer ${userJWT}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  test('GET /verifiedmemberships/user/:userID with invalid token should return 401', async () => {
    const res = await request(app)
      .get(`/verifiedmemberships/user/${testUser.userID}`)
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid token');
  });

  test('GET /verifiedmemberships/user/:userID without token should return 401', async () => {
    const res = await request(app)
      .get(`/verifiedmemberships/user/${testUser.userID}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'No token provided');
  });


})