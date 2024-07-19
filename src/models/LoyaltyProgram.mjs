import dbPool from '../config/database.mjs';

class LoyaltyProgram {
  constructor(loyaltyProgram) {
    this.programID = loyaltyProgram.programID;
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
  static async getLoyaltyProgramById(programId) {
    const query = `
      SELECT 
        *
      FROM
        LoyaltyProgramView
      WHERE
        programId = UUID_TO_BIN(?)
      `;
    try {
      const [rows] = await dbPool.query(query, [programId]);
      if (rows.length === 0) {
        return null;
      }
      return new LoyaltyProgram(rows[0]);
    } catch (err) {
      console.error(`Error finding Loyalty Program with ID ${programId}`, err);
      throw err;
    }
  }

  static async getLoyaltyProgramByName(name) {
    const query = `
      SELECT 
        *
      FROM
        LoyaltyProgramView
      WHERE
        name = ?
      `;
    try {
      const [rows] = await dbPool.query(query, [name]);
      if (rows.length === 0) {
        return null;
      }
      return new LoyaltyProgram(rows[0]);
    } catch (err) {
      console.error(`Error finding Loyalty Program with name ${name}`, err);
      throw err;
    }
  }
}

export default LoyaltyProgram;
