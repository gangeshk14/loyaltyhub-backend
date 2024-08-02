import dbPool from "../../config/database.mjs"
import VerifiedMemberships from "../VerifiedMemberships.mjs"
import User from "../User.mjs"
import LoyaltyProgram from "../LoyaltyProgram.mjs";

function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function createUserAndGetId() {
    let testUser;
    let testUserId;
    const userData = {
            userName: "testuser",
            password: "testpassword",
            firstName: "Test",
            lastName: "User",
            membershipType: "Silver",
            mobileNumber: "1234567890",
            email: "testuser@example.com",
    };
    testUser = await User.create(userData);
    testUserId = testUser.userID;
    return testUserId;
}

async function createLoyaltyProgramAndGetId() {
    let programId;
    const loyaltyProgramData = [
        'Test Program',
        'TC',
        'Description',
        'TRAVEL',
        'HOTEL',
        'Points',
        1.0,
        'Test Company',
        'http://test.com',
    ];

    const insertProgramQuery = `
            INSERT INTO LoyaltyProgram (name,code, description, category, subCategory, currencyName, currencyRate, company, enrollmentLink)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

   const resultProgram = await dbPool.query(insertProgramQuery, loyaltyProgramData);
   const getProgramIdQuery = `
            SELECT BIN_TO_UUID(programID) As programID FROM LoyaltyProgram WHERE name = ?
        `
    const [resultId] = await dbPool.query(getProgramIdQuery,[loyaltyProgramData[0]]);
    programId = resultId[0].programID
    const insertImageQuery = `
            INSERT INTO LoyaltyProgramImage (LoyaltyProgramID, image_data)
            VALUES (UUID_TO_BIN(?), ?)
        `;

    const imageData = generateRandomBinaryString(100);
    await dbPool.query(insertImageQuery, [programId, imageData]);
    return programId;
}


describe (`VerifiedMemberships`, () => {
    let testUserId;
    let testLoyaltyProgramId;
    const base64regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

    beforeAll(async () => {
        testUserId = await createUserAndGetId();
        testLoyaltyProgramId = await createLoyaltyProgramAndGetId();

    });

    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });

    test ('should create new verified membership record', async() => {

        const verifiedMembership = await VerifiedMemberships.create({
            userID: testUserId,
            loyaltyProgramID: testLoyaltyProgramId,
            membershipID: "MA-12345",
            firstName: "Test",
            lastName: "User"
        });

        expect(verifiedMembership).not.toBeNull();
        expect(verifiedMembership).toBeInstanceOf(VerifiedMemberships);
        expect(verifiedMembership.userID).toBe(testUserId);
        expect(verifiedMembership.loyaltyProgramID).toBe(testLoyaltyProgramId);
    });

    test ('should find a verified membership by user ID', async() => {

        const verifiedMembership = await VerifiedMemberships.create({
            userID: testUserId,
            loyaltyProgramID: testLoyaltyProgramId,
            membershipID: "MB-12345",
            firstName: "Test",
            lastName: "User"
        });

        const foundMembership = await VerifiedMemberships.findByUserID(testUserId)
        expect(foundMembership).not.toBeNull();
        expect(foundMembership[0].loyaltyProgramName).toBe('Test Program');
        // expect(foundMembership.loyaltyProgramName).toBe('Test Program');
        expect(base64regex.test(foundMembership[0].loyaltyProgramImage)).toBe(true);

    });

    test('should find a verified membership by loyalty program id and user id', async() => {

        const verifiedMembership = await VerifiedMemberships.create({
            userID: testUserId,
            loyaltyProgramID: testLoyaltyProgramId,
            membershipID: "DS-12345",
            firstName: "Test",
            lastName: "User"
        });

        const foundMembership = await VerifiedMemberships.findByMembershipID(testLoyaltyProgramId, testUserId)
        expect(foundMembership).not.toBeNull();
        expect(foundMembership).toBeInstanceOf(VerifiedMemberships);
    });

})




