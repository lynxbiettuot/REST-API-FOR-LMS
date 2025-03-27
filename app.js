const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const bodyParser = require('body-parser')

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

const MONGODB_URL = 'mongodb+srv://hoangvlinh09012004:09012004@restapi.4eifv.mongodb.net/mydata?retryWrites=true&w=majority&appName=restApi';

//Model
const Course = require('./models/courses.js');
const Student = require('./models/student.js');
const Instruction = require('./models/instruction.js');

//manage course by lecturer
const teacherRoutes = require('./routes/teacher/courses.js');
//student Routes 
const studentRoutes = require('./routes/student/student.js');

app.get('/', (req, res, next) => {
    res.send("Home page");
})

//teacher
app.use("/teacher", teacherRoutes);

//student
app.use("/student", studentRoutes);

mongoose.connect(MONGODB_URL).then(result => {
    app.listen(3000, () => {
        console.log('App is listening on port 3000');
    })
}).catch(err => {
    console.log(err);
})