import express from 'express';
import { fetchLoyaltyProgramByName, fetchLoyaltyPrograms } from '../controllers/LoyaltyProgram.mjs';
import {authMiddleware} from "../middleware/auth.mjs";

const router = express.Router();

router.get('/loyaltyprograms', authMiddleware, fetchLoyaltyPrograms);
router.get('/loyaltyprograms/:name', authMiddleware, fetchLoyaltyProgramByName);

export default router;
