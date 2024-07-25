import dbPool from '../config/database.mjs';
import * as fast from 'fast-csv';
import fs from 'fs';
import path, {dirname} from 'path';
import { format } from 'date-fns';
import {fileURLToPath} from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class Accrual {
    constructor(accrual) {
        this.MembershipID = accrual.MembershipID;
        this.firstName = accrual.firstName;
        this.lastName = accrual.lastName;
        this.Date = accrual.Date;
        this.rewardAmount = accrual.rewardAmount;
        this.loyaltyCode = accrual.loyaltyCode;
        this.rewardRecordID = accrual.rewardRecordID;
    }

    static async getAllAccruals() {
        const query = `
            SELECT 
                MembershipID,
                firstName,
                lastName,
                DATE_FORMAT(Date, '%Y-%m-%d') AS Date,
                rewardAmount,
                loyaltyCode,
                rewardRecordID
            FROM
            AccrualTable
            WHERE Date <= (
            CASE
                WHEN TIME(NOW()) > '23:00:00' THEN DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), '%Y-%m-%d 23:00:00')
                ELSE DATE_FORMAT(NOW(), '%Y-%m-%d 23:00:00')
            END
            );
      `;
        // WHERE
        // TIME_FORMAT(Date, '%H%i') <= '2300'
        try {
            const [rows] = await dbPool.query(query);
            if (rows.length === 0) {
                return [];
            }
            return rows.map(row => new Accrual(row));
        } catch (err) {
            console.error('Error retrieving Accruals', err);
            throw err;
        }
    }

    // static async exportAccrualsToCSV() {
    //     try {
    //         const accruals = await Accrual.getAllAccruals();
    //
    //         const csvData = accruals.map((accrual, index) => ({
    //             index: index + 1,
    //             'Member ID': accrual.MembershipID,
    //             'Member first name': accrual.firstName,
    //             'Member last name': accrual.lastName,
    //             'Transfer date': accrual.Date,
    //             'Amount': accrual.rewardAmount,
    //             'Partner Code': 'LH',
    //             'Reference number': accrual.rewardRecordID
    //         }));
    //
    //         if (csvData.length === 0) {
    //             console.log('No accruals found.');
    //             return;
    //         }
    //
    //         const currentDate = format(new Date(), 'yyyyMMdd');
    //         const fileName = `${csvData[0]['Partner Code']}_ACCRUAL_${currentDate}.txt`;
    //         const filePath = path.join(__dirname, fileName);
    //
    //         const writeStream = fs.createWriteStream(filePath);
    //
    //         fast
    //             .write(csvData, { headers: true})
    //             .pipe(writeStream)
    //             .on('finish', () => {
    //                 console.log(`CSV file has been created at ${filePath}`);
    //             });
    //
    //     } catch (err) {
    //         console.error('Error exporting accruals to CSV', err);
    //         throw err;
    //     }
    // }
    static async exportAccrualsToCSV() {
        try {
            const accruals = await Accrual.getAllAccruals();
            console.log(accruals)
            // Group accruals by loyaltyCode
            const groupedAccruals = accruals.reduce((acc, accrual) => {
                (acc[accrual.loyaltyCode] = acc[accrual.loyaltyCode] || []).push(accrual);
                return acc;
            }, {});

            const currentDate = format(new Date(), 'yyyyMMdd');

            // Iterate over each group and create a CSV file
            for (const loyaltyCode in groupedAccruals) {
                if (groupedAccruals.hasOwnProperty(loyaltyCode)) {
                    const csvData = groupedAccruals[loyaltyCode].map((accrual, index) => {
                        return {
                            index: index + 1,
                            'Member ID': accrual.MembershipID,
                            'Member first name': accrual.firstName,
                            'Member last name': accrual.lastName,
                            'Transfer date': accrual.Date,
                            'Amount': accrual.rewardAmount,
                            'Partner Code': 'LHB',
                            'Reference number': accrual.rewardRecordID
                        };
                    });

                    if (csvData.length === 0) {
                        console.log(`No accruals found for loyalty code ${loyaltyCode}.`);
                        continue;
                    }

                    const fileName = `${loyaltyCode}_ACCRUAL_${currentDate}.txt`;
                    const filePath = path.join(__dirname, fileName);

                    const writeStream = fs.createWriteStream(filePath);

                    await new Promise((resolve, reject) => {
                        fast
                            .write(csvData, { headers: true })
                            .pipe(writeStream)
                            .on('finish', resolve)
                            .on('error', reject);
                    });

                    console.log(`CSV file has been created at ${filePath} for loyalty code ${loyaltyCode}`);
                }
            }

        } catch (err) {
            console.error('Error exporting accruals to CSV', err);
            throw err;
        }
    }
}

export default Accrual;
