import express from 'express'
import session from 'express-session';
import cors from 'cors'
import dbPool from "./config/database.mjs";
// import uploadFiles from "./services/testSftp.mjs"
import sftpConfig from "./config/sftp.mjs";
import router from './routes/index.mjs';
import dotenv from 'dotenv';
import exportAccrualsToCSV  from "./services/AccrualToSFTP.mjs";
import processHandback from "./services/ProcessHandback.mjs";
import Accrual from "./models/Accrual.mjs";
import cron from 'node-cron';
import {setupSocketIO, userSockets} from './config/socketio.mjs';
import http from 'http';
import {insertTestData} from './__test__/testData.mjs';


const app = express()
const server = http.createServer(app);
const io = setupSocketIO(server);

if (process.env.NODE_ENV === 'devtest') {
    dotenv.config({ path: '.env.dev.test' });
    console.log(process.env.DB_NAME);
} else {
    dotenv.config();
}
// Schedule the job to run every 5 minutes
// exportAccrualsToCSV()
//     .then(() => {
//         console.log('CSV export completed successfully.');
//     })
//     .catch(err => {
//         console.error('Error during CSV export:', err);
//     });
// processHandback()
//     .then(() => {
//         console.log('process handback completed successfully.');
//     })
//     .catch(err => {
//         console.error('Error during process handback:', err);
//     });
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
    }
}));
const PORT = process.env.PORT;
app.use(router);
process.on('SIGINT', async () => {
    if(process.env.NODE_ENV === 'devtest'){
        await dbPool.query(`DROP DATABASE lhdbtest`);
        await dbPool.query(`CREATE DATABASE lhdbtest`);
        await dbPool.end();
        console.log("Test DB Cleared")
    }else{
        console.log('Closing database connection');
        await dbPool.end();
        console.log('Database connection closed');
    }
    process.exit(0); // Exit gracefully
});

if (process.env.NODE_ENV !== 'test') {
    cron.schedule('*/2 * * * *', () => {
        console.log('Running exportAccrualsToCSV');
        exportAccrualsToCSV()
            .then(() => {
                console.log('CSV export completed successfully.');
            })
            .catch(err => {
                console.error('Error during CSV export:', err);
            });
    });
    cron.schedule('*/3 * * * *', () => {
        console.log('Running process handback');
        processHandback()
            .then(() => {
                console.log('process handback completed successfully.');
            })
            .catch(err => {
                console.error('Error during process handback:', err);
            });
    });
    server.listen(PORT, async () => {
        console.log(`Server is running on Port:${PORT}`)
        if (process.env.NODE_ENV === 'devtest') {
            await insertTestData();
        }
    })
}
export default app;
