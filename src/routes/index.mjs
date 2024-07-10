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

router.post('/api/rewardsrecords', createRewardRecord);
router.get('/api/rewardsrecords/:recordID', getRewardRecordById);
router.get('/api/rewardsrecords/user/:userID', getRewardRecordByUserID);
router.put('/api/rewardsrecords/:recordID/status', updateRewardsRecordStatus);


export default router;
