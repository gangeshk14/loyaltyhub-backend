import express from 'express';
import { fetchLoyaltyPrograms } from '../controllers/LoyaltyProgram.mjs';

const router = express.Router();

router.get('/loyaltyprograms', fetchLoyaltyPrograms);

export default router;
