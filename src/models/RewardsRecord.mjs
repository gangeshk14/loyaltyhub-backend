import dbPool from "../config/database.mjs";


class RewardsRecord{
    constructor(rewardsRecord) {
        this.recordID = rewardsRecord.recordID;
        this.programID = rewardsRecord.programID;
        this.userID = rewardsRecord.userID;
        this.date = rewardsRecord.date;
        this.points = rewardsRecord.points;
        this.rewardType = rewardsRecord.rewardType;
        this.rewardAmount = rewardsRecord.rewardAmount;
        this.purpose = rewardsRecord.purpose;
        this.status = rewardsRecord.status;
    }

    //Create record
    static async create({userID, programID, date, points, rewardType, purpose}) {
        const query = `
            INSERT INTO RewardsRecord (UUID_TO_BIN(userID), UUID_TO_BIN(programID), date, points, rewardType, rewardAmount, purpose, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [userID, programID, date, points, rewardType, rewardAmount, purpose, status];
        try {
            const [result] = await dbPool.query(query, values);
            const recordID = result.insertId;
            return new RewardsRecord({recordID, userID, programID, date, points, rewardType, rewardAmount, purpose, status});
        } catch (err) {
            console.error('Error creating rewards record:', err);
            throw err;
        }
    }

    //Find all records


}

export default RewardsRecord;