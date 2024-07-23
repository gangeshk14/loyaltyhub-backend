import dbPool from "../config/database.mjs";
import User from "./User.mjs";
import LoyaltyProgram from "./LoyaltyProgram.mjs";

class RewardsRecord {
    constructor(rewardsRecord) {
        this.recordID = rewardsRecord.recordID;
        this.date = rewardsRecord.date;
        this.loyaltyProgramID = rewardsRecord.loyaltyProgramID;
        this.userID = rewardsRecord.userID;
        this.points = rewardsRecord.points;
        this.rewardType = rewardsRecord.rewardType;
        this.rewardAmount = rewardsRecord.rewardAmount;
        this.statuscode = rewardsRecord.statuscode;
        this.notified = rewardsRecord.notified;
        this.purpose = rewardsRecord.purpose || null;
    }

    //Create record
    static async create({ userID, loyaltyProgramId, points, rewardAmount, rewardType, purpose }) {

        const query = `
            INSERT INTO RewardsRecord ( Date, LoyaltyProgramID, UserID, Points, rewardType, rewardAmount, Purpose)
            VALUES (NOW(), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?)
        `;
        const values = [loyaltyProgramId, userID, points, rewardType, rewardAmount, purpose];
        try {
            await dbPool.query(query, values);
            // Retrieve the newly inserted record
            return new RewardsRecord({ date: Date(), loyaltyProgramID: loyaltyProgramId, userID: userID, points: points, rewardType: rewardType, rewardAmount: rewardAmount, status: 'SUBMITTED', purpose: purpose });
        } catch (err) {
            console.error('Error creating rewards record:', err);
            throw err;
        }
    }

    static async findById(recordID) {
        const query = `
            SELECT 
                BIN_TO_UUID(recordID) as recordID,
                date, 
                BIN_TO_UUID(loyaltyProgramID) as loyaltyProgramID,
                BIN_TO_UUID(userID) as userID,
                points,
                rewardType,
                rewardAmount,
                statuscode,
                notified,
                purpose
            FROM RewardsRecord WHERE recordID = UUID_TO_BIN(?)
        `;
        const values = [recordID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return new RewardsRecord(rows[0])
        } catch (err) {
            console.error('Error finding rewards record by ID:', err);
            throw err;
        }
    }

    static async findByUserID(userID) {
        const query = `
            SELECT 
                BIN_TO_UUID(recordID) as recordID,
                date, 
                BIN_TO_UUID(loyaltyProgramID) as loyaltyProgramID,
                BIN_TO_UUID(userID) as userID,
                points,
                rewardType,
                rewardAmount,
                statuscode,
                notified,
                purpose
            FROM RewardsRecord WHERE userID = UUID_TO_BIN(?)
        `;
        const values = [userID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return rows.map(row => new RewardsRecord(row))
        } catch (err) {
            console.error('Error finding rewards record by user ID:', err);
            throw err;
        }
    }

    static async findByLoyaltyProgramID(loyaltyProgramID) {
        const query = `
            SELECT 
                BIN_TO_UUID(recordID) as recordID,
                date, 
                BIN_TO_UUID(loyaltyProgramID) as loyaltyProgramID,
                BIN_TO_UUID(userID) as userID,
                points,
                rewardType,
                rewardAmount,
                statuscode,
                notified,
                purpose
            FROM RewardsRecord WHERE loyaltyProgramID = UUID_TO_BIN(?)
        `;
        const values = [loyaltyProgramID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return rows.map(row => new RewardsRecord(row))
        } catch (err) {
            console.error('Error finding rewards record by loyalty program ID:', err);
            throw err;
        }

    }

    static async updateStatus(recordID, status) {
        const query = `
            UPDATE RewardsRecord SET status = ? WHERE recordID = UUID_TO_BIN(?)
        `;
        const values = [status, recordID];
        try {
            await dbPool.query(query, values);
            return true;
        } catch (err) {
            console.error('Error updating status:', err);
            throw err
        }
    }

}

export default RewardsRecord;
