import dbPool from "../../config/database.mjs";
import { hash, verify } from "argon2";
import { jest } from '@jest/globals';
jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}));
const argon2 = await import('argon2');
import User from "../User.mjs";


describe('User Model', () => {
    let testUser;
    beforeAll(async () => {
        // Create a test user in the database
        const userData = {
            userName: "testuser",
            password: "testpassword",
            firstName: "Test",
            lastName: "User",
            membershipType: "",
            mobileNumber: "1234567890",
            email: "testuser@example.com"
        };
        testUser = await User.create(userData);
    });

    afterAll(async () => {
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
    });
    let foundUserById;

    test('Retrieve user by id,check password verification', async () => {
        foundUserById = await User.findById(testUser.userID);
        expect(foundUserById).toBeInstanceOf(User);
    });
    test('check if correct password', async () => {
        const isValid1 = await User.verifyPassword('testpassword', foundUserById.password);
        expect(isValid1).toBe(true);
    });
    test('check if wrong password', async () => {
        const isValid2 = await User.verifyPassword('wrongpassword', foundUserById.password);
        expect(isValid2).toBe(false);
    });

    test('findByEmail retrieves user by email', async () => {
        const foundUserbyEmail = await User.findByEmail(testUser.email);
        expect(foundUserbyEmail).toBeInstanceOf(User);
        expect(foundUserbyEmail.email).toBe(testUser.email);
    });

    test('findByUserName retrieves user by username', async () => {
        const foundUserbyName = await User.findByUserName(testUser.userName);
        expect(foundUserbyName).toBeInstanceOf(User);
        expect(foundUserbyName.userName).toBe(testUser.userName);
    });
    //
    test('getAllUser retrieves all users', async () => {
        const users = await User.getAllUser();
        expect(users).toBeInstanceOf(Array);
        expect(users.length).toBeGreaterThan(0);
        expect(users[0]).toBeInstanceOf(User);
    });
});
