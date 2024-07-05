import express from 'express';
import {registerUser, loginUser, getProfile} from '../controllers/User.mjs';
import { authMiddleware } from '../middleware/auth.mjs';

const router = express.Router();

router.post('/api/register', registerUser);
router.post('/api/login', loginUser);
router.get('/profile', authMiddleware, getProfile);


export default router;
