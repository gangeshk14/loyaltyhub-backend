import LoyaltyProgram from '../models/LoyaltyProgram.mjs';

export const fetchLoyaltyPrograms = async (req, res) => {
  try {
    const loyaltyPrograms = await LoyaltyProgram.getAllLoyaltyPrograms();
    if (!loyaltyPrograms) {
      return res.status(404).json({message: 'Loyalty Programs not found'});
    }
    res.json(loyaltyPrograms.map(loyaltyProgram => ({
      name : loyaltyProgram.name,
      code : loyaltyProgram.code,
      description : loyaltyProgram.description,
      category : loyaltyProgram.category,
      subcategory : loyaltyProgram.subcategory,
      currencyName : loyaltyProgram.currencyName,
      currencyRate : loyaltyProgram.currencyRate,
      company : loyaltyProgram.company,
      enrollmentLink : loyaltyProgram.enrollmentLink,
      image_data : loyaltyProgram.image_data.toString('base64')
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loyalty programs' });
  }
};
