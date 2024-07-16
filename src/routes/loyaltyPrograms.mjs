import express from 'express';
import { fetchLoyaltyPrograms } from '../controllers/loyaltyProgramsController.mjs';

const router = express.Router();

router.get('/', fetchLoyaltyPrograms);

export default router;
