import dbPool from '../config/database.mjs';

class LoyaltyProgram {
  constructor(loyaltyProgram) {
    this.name = loyaltyProgram.name;
    this.description = loyaltyProgram.description;
    this.category = loyaltyProgram.category;
    this.subcategory = loyaltyProgram.subcategory;
    this.currencyName = loyaltyProgram.currencyName;
    this.currencyRate = loyaltyProgram.currencyRate;
    this.company = loyaltyProgram.company;
    this.enrollmentLink = loyaltyProgram.enrollmentLink;
    this.image_data = loyaltyProgram.image_data;
}

  static async getAllLoyaltyPrograms() {
    const query = `
      SELECT 
        *
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
export default LoyaltyProgram
