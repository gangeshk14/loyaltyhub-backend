import { UUIDV1 } from "sequelize";
import dbPool from "../config/database.mjs";
import User from "./User.mjs";
import crypto from 'crypto';


class RewardsRecord {
    constructor(rewardsRecord) {
        this.recordID = rewardsRecord.recordID;
        this.date = rewardsRecord.date;
        this.loyaltyProgramID = rewardsRecord.loyaltyProgramID;
        this.userID = rewardsRecord.userID;
        this.points = rewardsRecord.points;
        this.rewardType = rewardsRecord.rewardType;
        this.rewardAmount = rewardsRecord.rewardAmount;
        this.status = rewardsRecord.status
        this.purpose = rewardsRecord.purpose || null;
    }

    //Create record
    static async create({ userID, loyaltyProgramID, date, points, rewardType, rewardAmount, status, purpose }) {
        const recordID = crypto.randomUUID();

        if (!(await User.findById(userID))) {
            throw new Error("User does not exist");
        }

        if (!(await RewardsRecord.findByLoyaltyProgramID(loyaltyProgramID))) {
            throw new Error("Loyalty Program does not exist");
        }

        const query = `
            INSERT INTO RewardsRecord (recordID, Date, LoyaltyProgramID, UserID, Points, rewardType, rewardAmount, Status, Purpose)
            VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?)
       `;
        const values = [recordID, date, loyaltyProgramID, userID, points, rewardType, rewardAmount, status, purpose];
        try {
            await dbPool.query(query, values);
            return new RewardsRecord({ recordID, date, loyaltyProgramID, userID, points, rewardType, rewardAmount, status, purpose });
        } catch (err) {
            console.error('Error creating rewards record:', err);
            throw err;
        }
    }

    static async findById(recordID) {
        const query = `
            SELECT * FROM RewardsRecord WHERE recordID = ?
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
            SELECT * FROM RewardsRecord WHERE userID = ?
        `;
        const values = [userID];
        try {
            const [rows] = await dbPool.query(query, values);
            return rows.map(row => new RewardsRecord(row));
        } catch (err) {
            console.error('Error finding rewards record by user ID:', err);
            throw err;
        }
    }

    static async findByLoyaltyProgramID(loyaltyProgramID) {
        const query = `
            SELECT * FROM RewardsRecord WHERE loyaltyProgramID = ?
        `;
        const values = [loyaltyProgramID];
        try {
            const [rows] = await dbPool.query(query, values);
            return rows.map(row => new RewardsRecord(row));
        } catch (err) {
            console.error('Error finding rewards record by loyalty program ID:', err);
            throw err;
        }

    }

    static async updateStatus(recordID, status) {
        const query = `
            UPDATE RewardsRecord SET status = ? WHERE recordID = ?
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
