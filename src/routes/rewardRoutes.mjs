import express from 'express';
import {
    createRewardRecord,
    getRewardRecordById,
    getRewardRecordByUserID,
    updateRewardsRecordStatus,
    updateNotifStatus
} from '../controllers/RewardsRecord.mjs';
import { authMiddleware } from '../middleware/auth.mjs';

const rewardRouter = express.Router();

rewardRouter.post('/rewardsrecords', authMiddleware, createRewardRecord);
rewardRouter.get('/rewardsrecords/:recordID', authMiddleware, getRewardRecordById);
rewardRouter.get('/rewardsrecords/user/:userID', authMiddleware, getRewardRecordByUserID);
rewardRouter.put('/rewardsrecords/:recordID/status', authMiddleware, updateRewardsRecordStatus);
rewardRouter.put('/updateNotif',authMiddleware,updateNotifStatus)

export default rewardRouter;
