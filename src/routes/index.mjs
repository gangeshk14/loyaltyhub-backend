import express from 'express';
import {registerUser, loginUser, getProfile} from '../controllers/User.mjs';
import { authMiddleware } from '../middleware/auth.mjs';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authMiddleware, getProfile);


export default router;
