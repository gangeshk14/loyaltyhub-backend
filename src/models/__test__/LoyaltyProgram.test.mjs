import dbPool from "../../config/database.mjs";
import LoyaltyProgram from "../LoyaltyProgram.mjs";
import User from "../User.mjs";
function generateRandomBinaryString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

describe('Loyalty Program ', () => {
    let loyaltyProgramData;
    let programId;
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    beforeAll(async () => {
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
            SELECT BIN_TO_UUID(programID) As programID FROM LoyaltyProgram WHERE name = ?
        `
        const selectQuery = `SELECT BIN_TO_UUID(userID) AS userID FROM User WHERE userName = ?`;
        const [resultId] = await dbPool.query(getProgramIdQuery,[loyaltyProgramData.name]);
        programId = resultId[0].programID
        const insertImageQuery = `
            INSERT INTO LoyaltyProgramImage (LoyaltyProgramID, image_data)
            SELECT programId, ?
            FROM LoyaltyProgram
            WHERE name = ?;
        `;
        const imageData = generateRandomBinaryString(100);
        const loyaltyImageData = [loyaltyProgramData.name, imageData]
        const resultImage = await dbPool.query(insertImageQuery, loyaltyImageData);
    });
    afterAll(async () => {
        // await dbPool.query(`DROP DATABASE lhdbtest`);
        // await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });
    test('should retrieve all loyalty program with image', async () => {
        const programs = await LoyaltyProgram.getAllLoyaltyPrograms();
        expect(programs).not.toBeNull();
        expect(programs[0]).toBeInstanceOf(LoyaltyProgram);
        expect(base64Regex.test(programs[0].image_data)).toBe(true);
    });
    test('should retrieve loyalty program by id', async () => {
        const programById = await LoyaltyProgram.getLoyaltyProgramById(programId);
        expect(programById).not.toBeNull();
        expect(programById).toBeInstanceOf(LoyaltyProgram);
        expect(base64Regex.test(programById.image_data)).toBe(true);
    });
    test('should retrieve loyalty program by name', async () => {
        const programByName = await LoyaltyProgram.getLoyaltyProgramByName(loyaltyProgramData.name);
        expect(programByName).not.toBeNull();
        expect(programByName).toBeInstanceOf(LoyaltyProgram);
        expect(base64Regex.test(programByName.image_data)).toBe(true);
    });
});