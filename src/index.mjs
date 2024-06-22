import express from 'express'
import dbConn from "./config/database.mjs";
const app = express()
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000
app.get('/', (req, res) => {
    res.status(201).send({msg:'Hello World'});
});
app.get('/api/users', (req, res) => {
    res.send([
        {id:1,user:'test1',displayName:'testify'},
        {id:2,user:'test2',displayName:'testifyw'}
    ]);
})
dbConn.connect(function (err) {
    if (err) throw err;
    console.log("Database Connected!");
});
app.listen(PORT,() =>{
    console.log(`Server is running on Port:${PORT}`)
})