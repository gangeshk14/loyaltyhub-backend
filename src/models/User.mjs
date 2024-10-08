import dbPool from "../config/database.mjs";
import * as argon2 from "argon2";

class User {
    constructor(user) {
        this.userID = user.userID;
        this.userName = user.userName;
        this.password = user.password;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.membershipType = user.membershipType;
        this.mobileNumber = user.mobileNumber;
        this.email = user.email;
        this.pointsCount = user.pointsCount;
        this.userRewardsRecord = user.userRewardsRecord || [];
    }
    //create user
    static async create({ userName, password, firstName, lastName, membershipType, mobileNumber, email }) {
        const hashedPassword = await argon2.hash(password);
        const query = `
            INSERT INTO User (userName, password, firstName, lastName, membershipType, mobileNumber, email, pointsCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0);
        `;
        const values = [userName, hashedPassword, firstName, lastName, membershipType, mobileNumber, email];
        try {
            const [result] = await dbPool.query(query, values);
            const selectQuery = `SELECT BIN_TO_UUID(userID) AS userID FROM User WHERE userName = ?`;
            const [userResult] = await dbPool.query(selectQuery, [userName]);
            const userID = userResult[0].userID;
            return new User({ userID, userName, firstName, lastName, membershipType, mobileNumber, email, pointsCount: 0 });
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    }

    //update user
    static async update(userId, userName, mobileNumber, email) {
        const query = `
            UPDATE User
            SET userName = ?, mobileNumber = ?, email = ?
            WHERE userID = UUID_TO_BIN(?)
        `;
        const values = [userName, mobileNumber, email, userId];
        
        try {
            const [result] = await dbPool.query(query, values);
            
            if (result.affectedRows === 0) {
                throw new Error('No user found with the given userID');
            }
            
            return { userId, userName, mobileNumber, email }; 
        } catch (err) {
            console.error('Error updating user:', err);
            throw err;
        }
        
    }
    
    
    //verify password
    static async verifyPassword(password, hashedPassword) {
        try {
            return await argon2.verify(hashedPassword, password);
        } catch (err) {
            console.error('Error verifying password:', err);
            return false;
        }
    }
    //find all users
    static async findAll() {
        const query = `
            SELECT 
                BIN_TO_UUID(userID) AS userID,
                userName,
                firstName,
                lastName,
                membershipType,
                mobileNumber,
                email,
                pointsCount,
                userRewardsRecord
            FROM UserView
        `;
        try {
            const [rows] = await dbPool.query(query);
            return rows.map(row => new User(row));
        } catch (err) {
            console.error('Error finding all users:', err);
            throw err;
        }
    }
    //find one user by id
    static async findById(userID) {
        const query = `
            SELECT 
                BIN_TO_UUID(userID) AS userID,
                userName,
                password,
                firstName,
                lastName,
                membershipType,
                mobileNumber,
                email,
                pointsCount,
                userRewardsRecord
            FROM UserView
            WHERE userID = UUID_TO_BIN(?)
        `;
        const values = [userID];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return new User(rows[0]);
        } catch (err) {
            console.error('Error finding user by ID:', err);
            throw err;
        }
    }
    static async updatePoints(userID, pointsToUpdate) {
        // Step 1: Retrieve the current points count
        if (typeof pointsToUpdate !== 'number' || !Number.isInteger(pointsToUpdate)) {
            throw new Error('Invalid points value provided. Points must be an integer.');
        }
        const findUserQuery = `
            SELECT pointsCount
            FROM UserView
            WHERE userID = UUID_TO_BIN(?)
        `;
        const findUserValues = [userID];
        try {
            const [rows] = await dbPool.query(findUserQuery, findUserValues);
            if (rows.length === 0) {
                throw new Error('User not found');
            }

            const currentPoints = rows[0].pointsCount;
            const newPointsCount = currentPoints + pointsToUpdate;

            // Step 2: Update the points count in the database
            const updatePointsQuery = `
                UPDATE User
                SET pointsCount = ?
                WHERE userID = UUID_TO_BIN(?)
            `;
            const updatePointsValues = [newPointsCount, userID];
            await dbPool.query(updatePointsQuery, updatePointsValues);

        } catch (err) {
            console.error('Error updating user points:', err);
            throw err;
        }
    }

    static async findByEmail(userEmail) {
        const query = `
            SELECT 
                BIN_TO_UUID(userID) AS userID,
                userName,
                password,
                firstName,
                lastName,
                membershipType,
                mobileNumber,
                email,
                pointsCount,
                userRewardsRecord
            FROM UserView
            WHERE email = ?
        `;
        const values = [userEmail];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return new User(rows[0]);
        } catch (err) {
            console.error('Error finding user by Email:', err);
            throw err;
        }
    }

    static async findByUserName(userName) {
        const query = `
            SELECT 
                BIN_TO_UUID(userID) AS userID,
                userName,
                firstName,
                password,
                lastName,
                membershipType,
                mobileNumber,
                email,
                pointsCount,
                userRewardsRecord
            FROM UserView
            WHERE userName = ?
        `;
        const values = [userName];
        try {
            const [rows] = await dbPool.query(query, values);
            if (rows.length === 0) {
                return null;
            }
            return new User(rows[0]);
        } catch (err) {
            console.error('Error finding user by username:', err);
            throw err;
        }
    }

    static async getAllUser() {
        const query = `
            SELECT 
                BIN_TO_UUID(userID) AS userID,
                userName,
                firstName,
                lastName,
                membershipType,
                mobileNumber,
                email,
                pointsCount,
                userRewardsRecord
            FROM UserView
        `;
        try {
            const [rows] = await dbPool.query(query);
            if (rows.length === 0) {
                return null;
            }
            return rows.map(row => new User(row));
        } catch (err) {
            console.error('Error finding Users', err);
            throw err;
        }
    }



}

export default User;
