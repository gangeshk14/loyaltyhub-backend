import express from 'express';
import { registerUser, loginUser, getProfile, getUsers, updateProfile } from '../controllers/User.mjs';
import { authMiddleware } from '../middleware/auth.mjs';

const userRouter = express.Router();

userRouter.post('/api/register', registerUser);
userRouter.post('/api/login', loginUser);
userRouter.get('/api/users', getUsers);
userRouter.get('/profile', authMiddleware, getProfile);
userRouter.put('/updateprofile',authMiddleware, updateProfile);

export default userRouter;
