import express from 'express';
import { fetchLoyaltyProgramById, fetchLoyaltyPrograms } from '../controllers/LoyaltyProgram.mjs';

const router = express.Router();

router.get('/loyaltyprograms', fetchLoyaltyPrograms);
router.get('/loyaltyprograms/:loyaltyProgramID', fetchLoyaltyProgramById);

export default router;
