import express from 'express';
import { fetchLoyaltyPrograms } from '../controllers/LoyaltyProgram.mjs';

const router = express.Router();

router.get('/loyalty-programs', fetchLoyaltyPrograms);

export default router;
