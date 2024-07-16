import { getLoyaltyPrograms } from '../models/loyaltyProgram.mjs';

export const fetchLoyaltyPrograms = async (req, res) => {
  try {
    const programs = await getLoyaltyPrograms();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loyalty programs' });
  }
};
