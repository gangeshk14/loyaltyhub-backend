import express from 'express';
import userRouter from './userRoutes.mjs';
import rewardRouter from './rewardRoutes.mjs';
import loyaltyProgramsRouter from './loyaltyProgramRoutes.mjs';
import verifyRouter from "./verifyTokenRoutes.mjs";
import verifiedMembershipsRouter from './VerifiedMembershipsRoutes.mjs';

const router = express.Router();

router.use(loyaltyProgramsRouter);
router.use(userRouter);
router.use(rewardRouter);
router.use(verifyRouter);
router.use(verifiedMembershipsRouter)

export default router;



