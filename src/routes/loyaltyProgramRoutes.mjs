import express from 'express';
import { fetchLoyaltyProgramByName, fetchLoyaltyPrograms } from '../controllers/LoyaltyProgram.mjs';

const router = express.Router();

router.get('/loyaltyprograms', fetchLoyaltyPrograms);
router.get('/loyaltyprograms/:name', fetchLoyaltyProgramByName);

export default router;
