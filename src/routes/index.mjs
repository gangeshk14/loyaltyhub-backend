import express from 'express';
import userRouter from './userRoutes.mjs';
import rewardRouter from './rewardRoutes.mjs';
import loyaltyProgramsRouter from './loyaltyPrograms.mjs';

const router = express.Router();

router.use(loyaltyProgramsRouter);
router.use(userRouter);
router.use(rewardRouter);

export default router;

