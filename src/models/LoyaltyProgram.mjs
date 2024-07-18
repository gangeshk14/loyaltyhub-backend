import dbPool from '../config/database.mjs';

class LoyaltyProgram {
  constructor(loyaltyProgram) {
    this.name = loyaltyProgram.name;
    this.image_data = loyaltyProgram.image_data;
    this.currencyRate = loyaltyProgram.currencyRate;
  }

  static async getAllLoyaltyPrograms() {
    const query = `
      SELECT 
        name,
        image_data,
        currencyRate
      FROM
        LoyaltyProgramView
      `;
    try {
      const [rows] = await dbPool.query(query);
      if (rows.length === 0) {
        return null;
      }
      return rows.map(row => new LoyaltyProgram(row));
    } catch (err) {
      console.error('Error finding Loyalty Programs', err);
      throw err;
    }
  }
}

export default LoyaltyProgram;
