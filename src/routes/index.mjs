import express from 'express';
import {registerUser, loginUser, getProfile, getUsers} from '../controllers/User.mjs';
import { authMiddleware } from '../middleware/auth.mjs';
import {
    createRewardRecord,
    getRewardRecordById,
    getRewardRecordByUserID,
    updateRewardsRecordStatus
} from "../controllers/RewardsRecord.mjs";

const router = express.Router();

router.post('/api/register', registerUser);
router.post('/api/login', loginUser);
router.get('/api/users', getUsers);
router.get('/profile', authMiddleware, getProfile);

router.post('/api/rewardsrecords', authMiddleware, createRewardRecord);
router.get('/api/rewardsrecords/:recordID', authMiddleware, getRewardRecordById);
router.get('/api/rewardsrecords/user/:userID', authMiddleware, getRewardRecordByUserID);
router.put('/api/rewardsrecords/:recordID/status', authMiddleware, updateRewardsRecordStatus);


export default router;
