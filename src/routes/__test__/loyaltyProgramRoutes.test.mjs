import request from 'supertest';
import app from '../../app.mjs';
import dbPool from '../../config/database.mjs';
import User from '../../models/User.mjs';
import LoyaltyProgram from "../../models/LoyaltyProgram.mjs";
function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
describe('Loyalty Program Routes', () => {
    let userJWT;
    let loyaltyProgramData;
    let programId;
    let imageData;
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
        await User.create(userData);
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
    });
    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });

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





    
});

