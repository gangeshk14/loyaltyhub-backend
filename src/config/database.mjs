import mysql from 'mysql2/promise'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as net from "node:net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    stream: function(opts) {
        var socket = net.connect(opts.config.port, opts.config.host);
        socket.setKeepAlive(true);
        return socket;
    },
    ssl: { ca: fs.readFileSync(__dirname + process.env.DB_SSL_PATH) }
});

const initDB = async () => {
    const createUserTableQuery = `
        CREATE TABLE IF NOT EXISTS User (
            userID BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
            userName VARCHAR(255) UNIQUE NOT NULL,
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
            name VARCHAR(255) UNIQUE NOT NULL,
            code VARCHAR(10) NOT NULL,
            description TEXT,
            category ENUM('TRAVEL'),
            subCategory ENUM('HOTEL','AIRLINE'),
            currencyName VARCHAR(255),
            currencyRate FLOAT NOT NULL,
            company VARCHAR(255),
            enrollmentLink VARCHAR(255)
        );
    `;
    const createLoyaltyProgramImageTableQuery = `
        CREATE TABLE IF NOT EXISTS LoyaltyProgramImage (
            LoyaltyProgramID BINARY(16) NOT NULL,
            image_data BLOB NOT NULL,
            FOREIGN KEY (LoyaltyProgramID) REFERENCES LoyaltyProgram(programId)
            ON DELETE CASCADE
            ON UPDATE CASCADE
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
            StatusCode VARCHAR(4) NOT NULL DEFAULT '0006',
            Purpose VARCHAR(255) NULL,
            Notified TINYINT(1) DEFAULT 0,
            FOREIGN KEY (LoyaltyProgramID) REFERENCES LoyaltyProgram(programId),
            FOREIGN KEY (UserID) REFERENCES User(userID),
            FOREIGN KEY (StatusCode) REFERENCES StatusCode(code)
        );
    `;
    const createVerifiedLoyaltyIDTableQuery = `
        CREATE TABLE IF NOT EXISTS VerifiedLoyaltyID (
            UserID BINARY(16) NOT NULL,
            LoyaltyProgramID BINARY(16) NOT NULL,
            MembershipID VARCHAR(255) UNIQUE NOT NULL,
            Date DATETIME NOT NULL,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            FOREIGN KEY (LoyaltyProgramID) REFERENCES LoyaltyProgram(programId),
            FOREIGN KEY (UserID) REFERENCES User(userID)
        );
    `;
    const createLoyaltyLoginTableQuery = `
        CREATE TABLE IF NOT EXISTS LoyaltyLoginDetails (
            LoyaltyProgramID BINARY(16) NOT NULL,
            MembershipID VARCHAR(255) NOT NULL,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            FOREIGN KEY (LoyaltyProgramID) REFERENCES LoyaltyProgram(programId)
        );
    `;
    const createStatusCodeTableQuery = `
        CREATE TABLE IF NOT EXISTS StatusCode (
            code VARCHAR(4) PRIMARY KEY,
            description VARCHAR(255) NOT NULL
        );
    `;
    const createAccrualTableQuery = `
        CREATE TABLE IF NOT EXISTS AccrualTable (
            MembershipID VARCHAR(255) NOT NULL,
            firstName VARCHAR(255) NOT NULL,
            lastName VARCHAR(255) NOT NULL,
            Date DATETIME NOT NULL,
            rewardAmount INT NOT NULL,
            loyaltyCode VARCHAR(20) NOT NULL,
            rewardRecordID VARCHAR(36) NOT NULL
        );
    `;
    const createAccrualSchedulerQuery = `
        CREATE EVENT IF NOT EXISTS InsertAccrualRecords
        ON SCHEDULE EVERY 1 MINUTE
        STARTS '2024-07-21 15:00:00'
        DO
        BEGIN
            INSERT INTO AccrualTable (MembershipID, firstName, lastName, Date, rewardAmount, loyaltyCode, rewardRecordID)
            SELECT
                v.MembershipID,
                v.firstName,
                v.lastName,
                r.Date,
                r.rewardAmount,
                l.code AS loyaltyCode,
                BIN_TO_UUID(r.recordID) AS rewardRecordID
            FROM
                RewardsRecord r
            JOIN
                VerifiedLoyaltyID v ON r.LoyaltyProgramID = v.LoyaltyProgramID AND r.UserID = v.UserID
            JOIN
                LoyaltyProgram l ON r.LoyaltyProgramID = l.programId
            WHERE
                r.Date >= NOW() - INTERVAL 1 MINUTE AND r.Date < NOW()
                AND r.Status = '0006';
        END;
    `
    const clearOldAccrualRecordsScheduler = `
        CREATE EVENT IF NOT EXISTS ClearOldAccrualRecords
        ON SCHEDULE EVERY 1 DAY
        STARTS '2024-07-21 23:01:00'
        DO
        BEGIN
            DELETE FROM AccrualTable
            WHERE Date <= DATE_FORMAT(NOW(), '%Y-%m-%d 23:00:00');
        END;    
    `

    const createUserViewQuery = `
        CREATE OR REPLACE VIEW UserView AS
            SELECT 
                U.userID,
                U.userName,
                U.firstName,
                U.lastName,
                U.password,
                U.membershipType,
                U.mobileNumber,
                U.email,
                U.pointsCount,
                COALESCE(
                    CASE 
                        WHEN COUNT(RR.recordID) > 0 THEN
                            JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'recordID', BIN_TO_UUID(RR.recordID),
                                    'date', RR.Date,
                                    'loyaltyProgramID', BIN_TO_UUID(RR.LoyaltyProgramID),
                                    'points', RR.Points,
                                    'rewardType', RR.rewardType,
                                    'rewardAmount', RR.rewardAmount,
                                    'status', RR.description,
                                    'notified', RR.Notified,
                                    'purpose', RR.Purpose
                                )
                            )
                        ELSE
                            JSON_ARRAY()
                    END,
                    JSON_ARRAY()
                ) AS userRewardsRecord
            FROM User U
            LEFT JOIN RewardsRecord RR ON U.userID = RR.UserID
            LEFT JOIN StatusCode SC ON RR.StatusCode = SC.code
            GROUP BY U.userID;

    `;
    const createLoyaltyProgramViewQuery = `
    CREATE OR REPLACE VIEW LoyaltyProgramView AS
    SELECT
        LP.programId,
        LP.name,
        LP.code,
        LP.description,
        LP.category,
        LP.subCategory,
        LP.currencyName,
        LP.currencyRate,
        LP.company,
        LP.enrollmentLink,
        LPI.image_data
    FROM 
        LoyaltyProgram LP
    LEFT JOIN 
        LoyaltyProgramImage LPI
    ON 
        LP.programId = LPI.LoyaltyProgramID
    `;
    try {
        await dbPool.query(createUserTableQuery);
        await dbPool.query(createStatusCodeTableQuery);
        await dbPool.query(createLoyaltyProgramTableQuery);
        await dbPool.query(createLoyaltyProgramImageTableQuery);
        await dbPool.query(createRewardsRecordTableQuery);
        await dbPool.query(createVerifiedLoyaltyIDTableQuery);
        await dbPool.query(createUserViewQuery);
        await dbPool.query(createLoyaltyProgramViewQuery);
        await dbPool.query(createLoyaltyLoginTableQuery);
        await dbPool.query(createAccrualTableQuery);
        await dbPool.query(createAccrualSchedulerQuery);
        await dbPool.query(clearOldAccrualRecordsScheduler);
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

await initDB().catch(err => {
    console.error('Error executing initDB:', err);
});
export default dbPool;
