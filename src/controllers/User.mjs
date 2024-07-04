import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import User from '../models/User.mjs';

const generateToken = (user) => {
    return jwt.sign({ userId: user.userID, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

export const registerUser = async (req, res) => {
    const { userName, password, firstName, lastName, email, membershipType, mobileNumber } = req.body;
    const hashedPassword = await argon2.hash(password);
    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const userId = await User.create({ userName, password: hashedPassword, firstName, lastName, membershipType, mobileNumber, email });
        res.status(201).json({ userId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
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