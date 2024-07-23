import dotenv from 'dotenv';
import Client from 'ssh2-sftp-client';
import { PassThrough } from 'node:stream';
import getStream from 'get-stream';
import { format } from 'date-fns';
import sftpConfig from '../config/sftp.mjs';
import * as csv from 'csv';
import RewardsRecord from "../models/RewardsRecord.mjs";
dotenv.config();

const sftp = new Client();

const currentDate = format(new Date(), 'yyyyMMdd');
const remoteHandbackBaseDir = `/tc-sftp/handback/Handback_${currentDate}`;

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

            await records.forEach(record => {
                // Access individual fields
                const rewardsRecordId = record['Reference number']
                const statusCode = record['Outcome Code']
                console.log(`Retrieving status code: ${statusCode}`);
                RewardsRecord.updateStatus(rewardsRecordId, statusCode);
                RewardsRecord.updateNotified(rewardsRecordId, '0');
            });
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
