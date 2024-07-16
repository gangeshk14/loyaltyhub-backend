import dbPool from '../config/database.mjs';

export const getLoyaltyPrograms = async () => {
  const query = `
    SELECT 
      lp.name, 
      lpi.image_data 
    FROM 
      LoyaltyProgram lp
    LEFT JOIN 
      LoyaltyProgramImage lpi 
    ON 
      lp.programId = lpi.LoyaltyProgramID
  `;

  const [rows] = await dbPool.query(query);
  return rows;
};
