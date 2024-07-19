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

    static async create({userID, loyaltyProgramID, membershipID, date, firstName, lastName }) {
        // const userQuery = `
        // SELECT firstName, lastName FROM User WHERE userID = UUID_TO_BIN(?);
        // `
        // const [userResult] = await dbPool.query(userQuery, [userID]);
        // const firstName = userResult[0].firstName;
        // const lastName = userResult[0].lastName;

        const query = `
        INSERT INTO VerifiedLoyaltyID (userID, loyaltyProgramID, membershipID, date, firstName, lastName) 
        VALUES (UUID_TOBIN(?), UUID_TOBIN(?), ?, ?, ?, ?)
        `;
        const values = [userID, loyaltyProgramID, membershipID, date, firstName, lastName];
        try {
            const [result] = await dbPool.query(query, values);
            const id = result.insertId;
            return new verifiedMemberships({id, userID, loyaltyProgramID, membershipID, date, firstName, lastName});
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