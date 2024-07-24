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
const app = express()
dotenv.config();
// Schedule the job to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
    console.log('Running exportAccrualsToCSV');
    exportAccrualsToCSV()
        .then(() => {
            console.log('CSV export completed successfully.');
        })
        .catch(err => {
            console.error('Error during CSV export:', err);
        });
});
cron.schedule('*/10 * * * *', () => {
    console.log('Running process handback');
    processHandback()
        .then(() => {
            console.log('process handback completed successfully.');
        })
        .catch(err => {
            console.error('Error during process handback:', err);
        });
});
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
    console.log('Closing database connection');
    await dbPool.end();
    console.log('Database connection closed');
    process.exit(0); // Exit gracefully
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on Port:${PORT}`)
    })
}
export default app;
