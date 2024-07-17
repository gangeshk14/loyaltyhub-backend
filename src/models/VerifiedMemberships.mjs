import dbPool from "../config/database.mjs"

class verifiedMemberships {
    constructor(verifiedMemberships) {
        this.id = verifiedMemberships.id;
        this.userID = verifiedMemberships.userID;
        this.loyaltyProgramID = verifiedMemberships.loyaltyProgramID;
        this.membershipID = verifiedMemberships.membershipID;
        this.date = verifiedMemberships.date;
    }

    static async create({userID, loyaltyProgramID, membershipID, date }) {
        const query = `
        INSERT INTO VerifiedLoyaltyID (userID, loyaltyProgramID, membershipID, date) 
        VALUES (UUID_TOBIN(?), UUID_TOBIN(?), ?, ?)
        `;
        const values = [userID, loyaltyProgramID, membershipID, date];
        try {
            const [result] = await dbPool.query(query, values);
            const id = result.insertId;
            return new verifiedMemberships({id, userID, loyaltyProgramID, membershipID, date});
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    static async findByUserID(userID) {
        const query = `
            SELECT * FROM VerifiedLoyaltyID WHERE userID = ?
        `;
        const values = [userID];
        try {
            const [rows] = await dbPool.query(query, values);
            return rows.map(row => new verifiedMemberships(row));
        } catch (err) {
            console.error('Error finding by user ID:', err);
            throw err;
        }
    }

    static async findByMembershipID(membershipID) {
        const query = `
        SELECT * FROM VerifiedLoyaltyID WHERE membershipID = ?
        `;
        const values = [membershipID];
        try {
            const [rows] = await dbPool.query(query, values);
            return rows.map(row => new verifiedMemberships(row));
        } catch (err) {
            console.error('Error finding by membershipID:', err);
            throw err;
        }
    }


}