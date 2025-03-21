const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser')

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

const MONGODB_URL = 'mongodb+srv://hoangvlinh09012004:09012004@restapi.4eifv.mongodb.net/mydata?retryWrites=true&w=majority&appName=restApi';

const courseRoutes = require('./routes/courses.js');

app.get('/', (req, res, next) => {
    res.send('Hello World!');
})

app.use(courseRoutes);

mongoose.connect(MONGODB_URL).then(result => {
    app.listen(3000, () => {
        console.log('App is listening on port 3000');
    })
}).catch(err => {
    console.log(err);
})