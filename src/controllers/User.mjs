import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import User from '../models/User.mjs';

const generateToken = (user) => {
    return jwt.sign({ userID: user.userID, userName: user.userName, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

export const registerUser = async (req, res) => {
    const { userName, password, firstName, lastName, email, membershipType, mobileNumber } = req.body;
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const userId = await User.create({ userName, password, firstName, lastName, membershipType, mobileNumber, email });
        res.status(201).json({ userId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const loginUser = async (req, res) => {
    const { userName, password } = req.body;
    try {
        const user = await User.findByUserName(userName);
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const passwordMatch = await User.verifyPassword(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = generateToken(user);
        res.status(200).json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const getProfile = async (req, res) => {
    const userID = req.user.userID;
    console.log(req.user)
    try {
        const user = await User.findById(userID);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            userID: user.userID,
            userName: user.userName,
            membershipType: user.membershipType,
            mobileNumber: user.mobileNumber,
            email: user.email,
            pointsCount: user.pointsCount,
            pointsRecord: user.pointsRecord,
            userRewardsRequests: user.userRewardsRequests
            // Add other properties as needed
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user profile', error: err.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.getAllUser();

        if (!users) {
            return res.status(404).json({ message: 'Users not found' });
        }
        res.json(users.map(user => ({
            userID: user.userID,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            membershipType: user.membershipType,
            mobileNumber: user.mobileNumber,
            email: user.email,
            pointsCount: user.pointsCount,
            pointsRecord: user.pointsRecord,
            userRewardsRequests: user.userRewardsRequests
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
};

export const updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { userName, mobileNumber, email } = req.body;
    try {
        console.log(1111)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: 'Fail to identify user by userID' });
        }
        const result = await User.update(userId, userName, mobileNumber, email);
        console.log('Updated user data:', { userName, mobileNumber, email });
        console.log('Function end');
        res.status(200).json(result);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Update failed' });
    }
};