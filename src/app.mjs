import express from 'express'
import session from 'express-session';
import cors from 'cors'
import dbPool from "./config/database.mjs";
import routes from './routes/index.mjs';
import dotenv from 'dotenv';
const app = express()
dotenv.config();
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
const PORT = process.env.PORT || 3000
app.use('/', routes);

app.listen(PORT,() =>{
    console.log(`Server is running on Port:${PORT}`)
})