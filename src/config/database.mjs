import mysql from 'mysql2'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const dbConn = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:{ca:fs.readFileSync(__dirname+process.env.DB_SSL_PATH)}
});
dbConn.connect(function (err) {
    if (err) throw err;
    console.log("Database Connected!");
});
export default dbConn;