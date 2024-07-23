import dbPool from "../config/database.mjs"

class verifiedMemberships {
    constructor(verifiedMemberships) {
        this.id = verifiedMemberships.id;
        this.userID = verifiedMemberships.userID;
        this.loyaltyProgramID = verifiedMemberships.loyaltyProgramID;
        this.membershipID = verifiedMemberships.membershipID;
        this.date = verifiedMemberships.date;
        this.firstName = verifiedMemberships.firstName;
        this.lastName = verifiedMemberships.lastName;
    }

    static async create({userID, loyaltyProgramID, membershipID, firstName, lastName }) {
        const query = `
        INSERT INTO VerifiedLoyaltyID (userID, loyaltyProgramID, membershipID, date, firstName, lastName) 
        VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, NOW(), ?, ?)
        `;
        const values = [userID, loyaltyProgramID, membershipID, firstName, lastName];
        try {
            await dbPool.query(query, values);
            return new verifiedMemberships({userID, loyaltyProgramID, membershipID, firstName, lastName});
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    static async findByUserID(userID) {
        const query = `
            SELECT 
                BIN_TO_UUID(VL.userID) AS userID,
                BIN_TO_UUID(VL.loyaltyProgramID) AS loyaltyProgramID,
                VL.membershipID,
                VL.date,
                VL.firstName,
                VL.lastName,
                LP.name AS loyaltyProgramName,
                LPI.image_data AS loyaltyProgramImage
            FROM VerifiedLoyaltyID VL
            JOIN LoyaltyProgram LP ON VL.loyaltyProgramID = LP.programId
            LEFT JOIN LoyaltyProgramImage LPI ON LP.programId = LPI.LoyaltyProgramID
            WHERE VL.userID = UUID_TO_BIN(?)        
        `;
        const values = [userID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return rows.map(row => ({
                userID: row.userID,
                loyaltyProgramID: row.loyaltyProgramID,
                membershipID: row.membershipID,
                date: row.date,
                firstName: row.firstName,
                lastName: row.lastName,
                loyaltyProgramName: row.loyaltyProgramName,
                loyaltyProgramImage: row.loyaltyProgramImage,
            }));
        } catch (err) {
            console.error('Error finding by user ID:', err);
            throw err;
        }
    }

    static async findByMembershipID(loyaltyProgramID, userID) {
        const query = `
            SELECT
                BIN_TO_UUID(userID) AS userID,
                BIN_TO_UUID(loyaltyProgramID) AS loyaltyProgramID,
                membershipID,
                date,
                firstName,
                lastName
            FROM VerifiedLoyaltyID 
            WHERE loyaltyProgramID = UUID_TO_BIN(?) AND userID = UUID_TO_BIN(?)
        `;
        const values = [loyaltyProgramID, userID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return new verifiedMemberships(rows[0]);
        } catch (err) {
            console.error('Error finding by program id and userid:', err);
            throw err;
        }
    }


}

export default verifiedMemberships;