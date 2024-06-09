import express from 'express'
const app = express()
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
app.listen(PORT,() =>{
    console.log(`Server is running on Port:${PORT}`)
})