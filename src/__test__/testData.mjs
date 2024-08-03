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

async function createWithID({ recordID, userID, loyaltyProgramID, date, points, rewardType, rewardAmount, statuscode, purpose }) {
    const query = `
        INSERT INTO RewardsRecord (recordID, Date, LoyaltyProgramID, UserID, Points, rewardType, rewardAmount, Statuscode, Purpose)
        VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)
    `;
    await dbPool.query(query, [recordID, date, loyaltyProgramID, userID, points, rewardType, rewardAmount, statuscode, purpose]);
}

async function getProgramId(loyaltyProgramName) {
    const getProgramIdQuery = `
        SELECT BIN_TO_UUID(programID) AS programID FROM LoyaltyProgram WHERE name = ?
    `;
    const [resultProgramId] = await dbPool.query(getProgramIdQuery, [loyaltyProgramName]);
    return resultProgramId[0].programID;
}

export async function insertTestData() {
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
    const testUser = await User.create(userData);

    const loyaltyProgramData = {
        name: 'Test Program',
        code: 'TC',
        description: 'Description',
        category: 'TRAVEL',
        subcategory: 'HOTEL',
        currencyName: 'Points',
        currencyRate: 1.0,
        company: 'Test Company',
        enrollmentLink: 'http://test.com'
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
        loyaltyProgramData.enrollmentLink
    ];
    const insertProgramQuery = `
        INSERT INTO LoyaltyProgram (name, code, description, category, subCategory, currencyName, currencyRate, company, enrollmentLink)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await dbPool.query(insertProgramQuery, loyaltyProgramValues);

    const getProgramIdQuery = `
        SELECT programID AS programID FROM LoyaltyProgram WHERE name = ?
    `;
    const [resultId] = await dbPool.query(getProgramIdQuery, [loyaltyProgramData.name]);
    const programId = resultId[0].programID;

    const insertImageQuery = `
        INSERT INTO LoyaltyProgramImage (LoyaltyProgramID, image_data)
        VALUES (?, ?);
    `;
    const imageData = Buffer.from(generateRandomBinaryString(16), 'utf8');
    const loyaltyImageData = [programId, imageData];
    await dbPool.query(insertImageQuery, loyaltyImageData);

    await dbPool.query(`
        INSERT INTO statuscode (code, description) VALUES
        ('0000', 'success'),
        ('0001', 'member not found'),
        ('0002', 'member name mismatch'),
        ('0003', 'member account closed'),
        ('0004', 'member account suspended'),
        ('0005', 'member ineligible for accrual'),
        ('0006', 'submitted'),
        ('0007', 'processing'),
        ('0099', 'unable to process, please contact support for more information')
    `);

    const testRewardModel = {
        recordID: crypto.randomUUID(),
        date: new Date("2024-01-01"),
        loyaltyProgramID: await getProgramId('Test Program'),
        userID: testUser.userID,
        points: 0,
        rewardType: 'testreward',
        rewardAmount: 5000,
        statuscode: '0006',
        purpose: 'testReward'
    };
    await createWithID(testRewardModel);
}
