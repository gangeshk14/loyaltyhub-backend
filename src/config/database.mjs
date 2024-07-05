import mysql from 'mysql2/promise'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:{ca:fs.readFileSync(__dirname+process.env.DB_SSL_PATH)}
});

const initDB = async () => {
    const createUserTableQuery = `
        CREATE TABLE IF NOT EXISTS User (
            userID BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
            userName VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            membershipType VARCHAR(255),
            mobileNumber VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            pointsCount INT DEFAULT 0
        );
    `;

    const createLoyaltyProgramTableQuery = `
        CREATE TABLE IF NOT EXISTS LoyaltyProgram (
            programId BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            currencyName VARCHAR(255),
            currencyRate FLOAT NOT NULL,
            company VARCHAR(255),
            enrollmentLink VARCHAR(255)
        );
    `;

    const createRewardsRecordTableQuery = `
        CREATE TABLE IF NOT EXISTS RewardsRecord (
            recordID BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
            Date DATETIME NOT NULL,
            LoyaltyProgramID BINARY(16) NOT NULL,
            UserID BINARY(16) NOT NULL,
            Points INT NOT NULL,
            rewardType VARCHAR(255),
            rewardAmount INT,
            Status ENUM('PENDING', 'GRANTED', 'REJECTED') NOT NULL,
            Purpose VARCHAR(255),
            FOREIGN KEY (LoyaltyProgramID) REFERENCES LoyaltyProgram(programId),
            FOREIGN KEY (UserID) REFERENCES User(userID)
        );
    `;

    const createUserViewQuery = `
        CREATE VIEW UserView AS
        SELECT 
            BIN_TO_UUID(U.userID) AS userID,
            U.userName,
            U.firstName,
            U.lastName,
            U.password,
            U.membershipType,
            U.mobileNumber,
            U.email,
            U.pointsCount,
            COALESCE(JSON_ARRAYAGG(
                CASE WHEN RR.Status IN ('GRANTED', 'REJECTED') THEN
                    JSON_OBJECT(
                        'recordID', BIN_TO_UUID(RR.recordID),
                        'Date', RR.Date,
                        'LoyaltyProgramID', BIN_TO_UUID(RR.LoyaltyProgramID),
                        'Points', RR.Points,
                        'rewardType', RR.rewardType,
                        'rewardAmount', RR.rewardAmount,
                        'Status', RR.Status,
                        'Purpose', RR.Purpose
                    )
                END
            ), JSON_ARRAY()) AS pointsRecord,
            COALESCE(JSON_ARRAYAGG(
                CASE WHEN RR.Status = 'PENDING' THEN
                    JSON_OBJECT(
                        'recordID', BIN_TO_UUID(RR.recordID),
                        'Date', RR.Date,
                        'LoyaltyProgramID', BIN_TO_UUID(RR.LoyaltyProgramID),
                        'Points', RR.Points,
                        'rewardType', RR.rewardType,
                        'rewardAmount', RR.rewardAmount,
                        'Status', RR.Status,
                        'Purpose', RR.Purpose
                    )
                END
            ), JSON_ARRAY()) AS userRewardsRequests
        FROM User U
        LEFT JOIN RewardsRecord RR ON U.userID = RR.UserID
        GROUP BY U.userID;
    `;
    try {
        await dbPool.query(createUserTableQuery);
        await dbPool.query(createLoyaltyProgramTableQuery);
        await dbPool.query(createRewardsRecordTableQuery);
        // await dbPool.query(createUserViewQuery);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

initDB().catch(err => {
    console.error('Error executing initDB:', err);
});
export default dbPool;