import request from 'supertest';
import app from '../app.mjs';
import dbPool from '../config/database.mjs';
import User from '../models/User.mjs';
function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
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
describe('End to End Testing', () => {
    let testUser;
    let loyaltyProgramData;
    let programId;
    let imageData;
    let userJWT;
    let testRewardModel;
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
    //user logs in
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

    //user gets profile and goes to homepage upon successful login
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

    //user clicks transfer points and all loyalytprograms are retrieved
    test('GET /loyaltyprograms with valid token should return loyalty programs', async () => {
        const res = await request(app)
            .get('/loyaltyprograms')
            .set('Authorization', `Bearer ${userJWT}`);
            res.body.forEach(program => {
                expect(program).toHaveProperty('name');
                expect(program).toHaveProperty('code');
                expect(program).toHaveProperty('description');
                expect(program).toHaveProperty('category');
                expect(program).toHaveProperty('subcategory');
                expect(program).toHaveProperty('currencyName');
                expect(program).toHaveProperty('currencyRate');
                expect(program).toHaveProperty('company');
                expect(program).toHaveProperty('enrollmentLink');
                expect(program).toHaveProperty('image_data');
                expect(program.image_data).toMatch(/^[A-Za-z0-9+/=]+$/);
            });
    });
    test('GET /loyaltyprograms with invalid token should return 401', async () => {
        const res = await request(app)
            .get('/loyaltyprograms')
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    test('GET /loyaltyprograms without token should return 401', async () => {
        const res = await request(app)
            .get('/loyaltyprograms');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    //user clicks loyalty program to transfer to
    test('GET /loyaltyprograms/:name with valid token should return loyalty program details', async () => {
        const res = await request(app)
            .get(`/loyaltyprograms/${loyaltyProgramData.name}`)
            .set('Authorization', `Bearer ${userJWT}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', loyaltyProgramData.name);
        expect(res.body).toHaveProperty('code', loyaltyProgramData.code);
        expect(res.body).toHaveProperty('description', loyaltyProgramData.description);
        expect(res.body).toHaveProperty('category', loyaltyProgramData.category);
        expect(res.body).toHaveProperty('subcategory', loyaltyProgramData.subcategory);
        expect(res.body).toHaveProperty('currencyName', loyaltyProgramData.currencyName);
        expect(res.body).toHaveProperty('currencyRate', loyaltyProgramData.currencyRate);
        expect(res.body).toHaveProperty('company', loyaltyProgramData.company);
        expect(res.body).toHaveProperty('enrollmentLink', loyaltyProgramData.enrollmentLink);
        expect(res.body).toHaveProperty('image_data', imageData.toString('base64'));
    });

    test('GET /loyaltyprograms/:name with invalid token should return 401', async () => {
        const res = await request(app)
            .get(`/loyaltyprograms/${loyaltyProgramData.name}`)
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    test('GET /loyaltyprograms/:name without token should return 401', async () => {
        const res = await request(app)
            .get(`/loyaltyprograms/${loyaltyProgramData.name}`);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    test('GET /loyaltyprograms/:name with non-existent name should return 404', async () => {
        const res = await request(app)
            .get('/loyaltyprograms/NonExistentName')
            .set('Authorization', `Bearer ${userJWT}`);

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('message', 'Loyalty Program not found');
    });

    //making sure user has a verified membership
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

  //user can now submit a reward request successfully
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

    //allows user to check on status of his rewards request
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

    //user gets notified once request gets updated
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

