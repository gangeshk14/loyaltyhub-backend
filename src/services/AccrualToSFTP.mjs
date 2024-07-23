import { format } from 'date-fns';
import {stringify} from "csv";
import path, { dirname } from 'path';
import fs from 'fs';
import * as fast from 'fast-csv';
import Accrual from '../models/Accrual.mjs';
import { fileURLToPath } from 'url';
import sftpConfig from '../config/sftp.mjs';
import Client from 'ssh2-sftp-client';
import {Readable} from "stream";
async function generateCSVData(csvData) {
    return new Promise((resolve, reject) => {
        stringify(csvData, { header: true }, (err, output) => {
            if (err) {
                reject(err);
            } else {
                const buffer = Buffer.from(output, 'utf-8');
                resolve(buffer);
            }
        });
    });
}
const getRandomOutcomeCode = () => {
    const codes = [
        '0000','0000', '0000', '0001', '0002', '0003', '0004', '0005', '0099'
    ];
    const randomIndex = Math.floor(Math.random() * codes.length);
    return codes[randomIndex];
};

const exportAccrualsToCSV = async () => {
    const sftp = new Client();
    try {
        const accruals = await Accrual.getAllAccruals();
        // Group accruals by loyaltyCode
        const groupedAccruals = accruals.reduce((acc, accrual) => {
            (acc[accrual.loyaltyCode] = acc[accrual.loyaltyCode] || []).push(accrual);
            return acc;
        }, {});

        const currentDate = format(new Date(), 'yyyyMMdd');
        const remoteAccrualBaseDir = `/tc-sftp/accrual/Accrual_${currentDate}`;
        const remoteHandbackBaseDir = `/tc-sftp/handback/Handback_${currentDate}`;
        await sftp.connect(sftpConfig);

        try {
            await sftp.mkdir(remoteAccrualBaseDir, true);
        } catch (err) {
            console.error(`Error creating directory ${remoteAccrualBaseDir}:`, err.message);
        }
        try {
            await sftp.mkdir(remoteHandbackBaseDir, true);
        } catch (err) {
            console.error(`Error creating directory ${remoteHandbackBaseDir}:`, err.message);
        }

        // Iterate over each group and create a CSV file
        for (const loyaltyCode in groupedAccruals) {
            if (groupedAccruals.hasOwnProperty(loyaltyCode)) {
                const csvAccrualData = groupedAccruals[loyaltyCode].map((accrual, index) => {
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
                const csvHandbackData = groupedAccruals[loyaltyCode].map((accrual, index) => {
                    return {
                        index: index + 1,
                        'Transfer date': accrual.Date,
                        'Amount': accrual.rewardAmount,
                        'Reference number': accrual.rewardRecordID,
                        'Outcome Code':getRandomOutcomeCode()
                    };
                });

                if (csvAccrualData.length === 0) {
                    console.log(`No accruals found for loyalty code ${loyaltyCode}.`);
                    continue;
                }

                const accrualFileName = `${loyaltyCode}_ACCRUAL_${currentDate}.txt`;
                const remoteAccrualFilePath = `${remoteAccrualBaseDir}/${accrualFileName}`;
                try {
                    const csvBuffer = await generateCSVData(csvAccrualData);
                    await sftp.put(csvBuffer, remoteAccrualFilePath)
                    console.log(`CSV file has been uploaded to ${remoteAccrualFilePath} for loyalty code ${loyaltyCode}`);
                } catch (err) {
                    console.error('Error during CSV generation:', err);
                }
                const handbackFileName = `${loyaltyCode}_ACCRUAL_${currentDate}.txt`;
                const remoteHandbackFilePath = `${remoteHandbackBaseDir}/${handbackFileName}`;
                try {
                    const csvBuffer = await generateCSVData(csvHandbackData);
                    await sftp.put(csvBuffer, remoteHandbackFilePath)
                    console.log(`CSV file has been uploaded to ${remoteHandbackFilePath} for loyalty code ${loyaltyCode}`);
                } catch (err) {
                    console.error('Error during CSV generation:', err);
                }
            }
        }
    } catch (err) {
        console.error('Error exporting accruals to CSV', err);
        throw err;
    } finally {
        await sftp.end();
        console.log('Connection closed');
    }
};

export default exportAccrualsToCSV;
