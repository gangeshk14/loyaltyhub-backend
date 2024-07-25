'use strict';

import dotenv from 'dotenv';
import { Readable } from 'stream';
import Client from 'ssh2-sftp-client';
import sftpConfig from "../config/sftp.mjs";


const sftp = new Client();

const createFileStream = (content) => {
    const stream = new Readable();
    stream.push(content);
    stream.push(null);
    return stream;
};

const uploadFiles = async (remotePaths) => {
    await sftp.connect(sftpConfig);
    try {
        for (const remotePath of remotePaths) {
            const content = 'hello';
            const fileStream = createFileStream(content);
            await sftp.put(fileStream, remotePath);
            console.log(`Uploaded ${remotePath}`);
        }
        await sftp.end();
        console.log('All files uploaded successfully');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

const remoteFiles = [
    '/tc-sftp/accrual/file1.txt',
    '/tc-sftp/accrual/file2.txt',
];

await uploadFiles(remoteFiles);
export default uploadFiles;