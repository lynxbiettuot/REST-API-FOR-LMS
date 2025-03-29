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
const Admin = require('./models/admin.js');

//manage course by lecturer
const teacherRoutes = require('./routes/teacher/courses.js');
//student Routes 
const studentRoutes = require('./routes/student/student.js');

//Admin
const managingCourseAdmin = require('./routes/admin/manageCourse.js');

app.get('/', (req, res, next) => {
    // try {
    //     const name = 'Admin demo';
    //     const email = 'Admin email';
    //     const password = 'Admin password';
    //     const x = new mongoose.Types.ObjectId("67e51b39bcfb1944ea3ed088");
    //     const y = new mongoose.Types.ObjectId("67e5269187897410741b0376");
    //     const fullCourse = [];
    //     fullCourse.push(x);
    //     fullCourse.push(y);
    //     const z = new mongoose.Types.ObjectId("67e5191106151ec3dd1ccd3f");
    //     const instructor = [];
    //     instructor.push(z);
    //     const t = new mongoose.Types.ObjectId("67e51a131161d5d170f9525b");
    //     const student = [];
    //     student.push(t);
    //     const newAdmin = new Admin({
    //         name: name,
    //         email: email,
    //         password: password,
    //         fullCourse: fullCourse,
    //         instructor: instructor,
    //         student: student,
    //     })
    //     await newAdmin.save();
    //     res.json({ "accout": newAdmin });
    // } catch (err) {
    //     console.log(err);
    // }
    res.json({ "message": "Okay" });
})

//teacher
app.use("/teacher", teacherRoutes);

//student
app.use("/student", studentRoutes);

// admin
app.use("/admin", managingCourseAdmin);

mongoose.connect(MONGODB_URL).then(result => {
    app.listen(3000, () => {
        console.log('App is listening on port 3000');
    })
}).catch(err => {
    console.log(err);
})