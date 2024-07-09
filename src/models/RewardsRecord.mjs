import dbPool from "../config/database.mjs";


class RewardsRecord{
    constructor(rewardsRecord) {
        this.recordID = rewardsRecord.recordID;
        this.date = rewardsRecord.date;
        this.loyaltyProgramID = rewardsRecord.loyaltyProgramID;
        this.userID = rewardsRecord.userID;
        this.points = rewardsRecord.points;
        this.rewardType = rewardsRecord.rewardType;
        this.rewardAmount = rewardsRecord.rewardAmount;
        this.status = rewardsRecord.status || "PENDING";
        this.purpose = rewardsRecord.purpose;
    }

    //Create record
    static async create({userID, loyaltyProgramID, date, points, rewardType, status, purpose}) {
        const query = `
            INSERT INTO RewardsRecord (date, UUID_TO_BIN(loyaltyProgramID), UUID_TO_BIN(userID), points, rewardType, status, purpose)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [date, loyaltyProgramID, userID, points, rewardType, status, purpose];
        try {
            const [result] = await dbPool.query(query, values);
            const recordID = result.insertId;
            return new RewardsRecord({recordID, date, loyaltyProgramID, userID, points, rewardType, status, purpose});
        } catch (err) {
            console.error('Error creating rewards record:', err);
            throw err;
        }
    }

    // method here to update reward amount based on info

    //Find all records


}

export default RewardsRecord;