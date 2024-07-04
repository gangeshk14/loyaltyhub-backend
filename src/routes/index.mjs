import express from 'express';
import { registerUser, loginUser } from '../controllers/User.mjs';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
