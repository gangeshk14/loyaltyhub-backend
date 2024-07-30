import dotenv from 'dotenv';
import Client from 'ssh2-sftp-client';
import { PassThrough } from 'node:stream';
import getStream from 'get-stream';
import { format } from 'date-fns';
import sftpConfig from '../config/sftp.mjs';
import * as csv from 'csv';
import RewardsRecord from "../models/RewardsRecord.mjs";
import User from "../models/User.mjs";
import { io , userSockets } from '../config/socketio.mjs';
dotenv.config();

const sftp = new Client();

const currentDate = format(new Date(), 'yyyyMMdd');
const remoteHandbackBaseDir = `/tc-sftp/handback/Handback_${currentDate}`;
async function processRecords(stream) {
    const records = [];

    // Collect all records from the stream
    for await (const record of stream) {
        records.push(record);
    }
    for (const record of records) {
        // Access individual fields
        const rewardsRecordId = record['Reference number'];
        const statusCode = record['Outcome Code'];
        
        try {
            // Await the async function
            console.log(`Retrieving status code: ${statusCode}`);
            const notifDetails = await RewardsRecord.getNotifDetails(rewardsRecordId)
            const userID = notifDetails.userID;
            const rewardType = notifDetails.rewardType;
            const rewardAmount = notifDetails.rewardAmount;
            const socketId = userSockets[userID];
            if (socketId) {
                if(statusCode === '0000') {
                    io.to(socketId).emit('notification', { message: `Your request of ${rewardAmount} ${rewardType} has been approved` });
                } else {
                    io.to(socketId).emit('notification', { message: `Your request of ${rewardAmount} ${rewardType} has been rejected. Please check status for more details.` });
                    const pointsUser = parseInt(notifDetails.pointsUsed, 10);
                    await User.updatePoints(userID,pointsUser);
                }
                await RewardsRecord.updateNotified(rewardsRecordId, 1);
                console.log('Notification sent');
            } else {
                console.log("no user");
                await RewardsRecord.updateNotified(rewardsRecordId, 0);
            }

            // Update status
            await RewardsRecord.updateStatus(rewardsRecordId, statusCode);
        } catch (error) {
            console.error(`Error processing record ${rewardsRecordId}:`, error);
        }
    }
}
const processHandback = async()=> {
    try {
        await sftp.connect(sftpConfig);
        console.log('Connection established');

        const fileList = await sftp.list(remoteHandbackBaseDir);

        for (const file of fileList) {
            const remoteFilePath = `${remoteHandbackBaseDir}/${file.name}`;
            console.log(`Retrieving file: ${remoteFilePath}`);
            const pt = new PassThrough();
            const fileStream = await sftp.get(remoteFilePath, pt);
            const fileContents = await getStream(fileStream);
            const records = csv.parse(fileContents, {
                columns: true,
                skip_empty_lines: true
            });
            await processRecords(records);
            // await records.forEach(record => {
            //     // Access individual fields
            //     const rewardsRecordId = record['Reference number']
            //     const statusCode = record['Outcome Code']
            //     variable = RewardsRecord.getNotifDetails(rewardsRecordId)
            //     console.log(`Retrieving status code: ${statusCode}`);
            //     const socketId = userSockets[userID];
            //     if (socketId) {
            //         if(statusCode==='0000'){
            //             io.to(socketId).emit('notification', { message:`Your request of ${rewardAmount} ${rewardType} has been approved`});
            //         }else{
            //             io.to(socketId).emit('notification', { message:`Your request of ${rewardAmount} ${rewardType} has been rejected. Please check status for more details.`});
            //         }
            //         RewardsRecord.updateNotified(rewardsRecordId, 1);
            //         console.log('Notification sent');
            //       } else {
            //         console.log("no user")
            //         RewardsRecord.updateNotified(rewardsRecordId, 0);
            //       }
            //     RewardsRecord.updateStatus(rewardsRecordId, statusCode);
            // });
        }

        console.log('All files retrieved and printed');
    } catch (err) {
        console.error(`Error: ${err.message}`);
    } finally {
        await sftp.end();
        console.log('Connection closed');
    }
};

export default processHandback;
