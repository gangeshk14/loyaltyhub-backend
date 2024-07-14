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

router.post('/rewardsrecords', authMiddleware, createRewardRecord);
router.get('/rewardsrecords/:recordID', authMiddleware, getRewardRecordById);
router.get('/rewardsrecords/user/:userID', authMiddleware, getRewardRecordByUserID);
router.put('/rewardsrecords/:recordID/status', authMiddleware, updateRewardsRecordStatus);


export default router;
