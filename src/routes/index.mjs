import express from 'express';
import userRouter from './userRoutes.mjs';
import rewardRouter from './rewardRoutes.mjs';

const router = express.Router();

router.use(userRouter);
router.use(rewardRouter);

export default router;
