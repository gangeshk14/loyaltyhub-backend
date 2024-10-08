import { format } from 'date-fns';
import {stringify} from "csv";
import RewardsRecord from "../models/RewardsRecord.mjs";
import Accrual from '../models/Accrual.mjs';
import sftpConfig from '../config/sftp.mjs';
import Client from 'ssh2-sftp-client';
import { io , userSockets } from '../config/socketio.mjs';
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
                const handbackFileName = `${loyaltyCode}_HANDBACK_${currentDate}.txt`;
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
        for (const accrual of accruals) {
            const statusCode = await RewardsRecord.getStatus(accrual.rewardRecordID)
            const notifDetails = await RewardsRecord.getNotifDetails(accrual.rewardRecordID)
            const userID = notifDetails.userID;
            const rewardType = notifDetails.rewardType;
            const rewardAmount = notifDetails.rewardAmount;
            const socketId = userSockets[userID];
            if (socketId) {
                io.to(socketId).emit('notification', { message:`Your request of ${rewardAmount} ${rewardType} has been updated`});
                await RewardsRecord.updateNotified(accrual.rewardRecordID, 1);
                console.log('Notification sent');
              } else {
                console.log("no user")
                await RewardsRecord.updateNotified(accrual.rewardRecordID, 0);
              }
            await RewardsRecord.updateStatus(accrual.rewardRecordID, '0007');
            console.log(`${accrual.rewardRecordID} statuscode updated`);
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
