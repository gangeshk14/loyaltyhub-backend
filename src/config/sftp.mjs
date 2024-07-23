import Client from 'ssh2-sftp-client';
import fs from 'fs'
import dotenv from 'dotenv';
import {dirname} from "path";
dotenv.config();
const sftpConfig = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT || 22, // Default to port 22 if not specified
    username: process.env.SFTP_USERNAME,
    privateKey: fs.readFileSync(process.env.SFTP_PRIVATE_KEY),
};

const sftp = new Client();

async function testSFTPConnection() {
    try {
        await sftp.connect(sftpConfig);
        const remoteDirList = await sftp.list('/tc-sftp');
        // Print the details of each file and directory
        console.log('Remote directory listing:');
        remoteDirList.forEach(item => {
            console.log(`${item.type === 'd' ? 'Directory' : 'File'}: ${item.name}`);
            if (item.type === 'f') {
                console.log(`Size: ${item.size} bytes`);
                console.log(`Last modified: ${item.modify}`);
            }
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        try {
            await sftp.end(); // Ensure the connection is closed
        } catch (endError) {
            console.error(`Error closing the connection: ${endError.message}`);
        }
    }
}
await testSFTPConnection().catch(err => {
    console.error('Error connecting to sftp', err);
});
export default sftpConfig

