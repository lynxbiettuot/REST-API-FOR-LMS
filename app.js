const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());

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
//Course router
const courseRouter = require('./routes/courses/course.js');

//Admin
const managingCourseAdmin = require('./routes/admin/manageCourse.js');
const managingInstructor = require('./routes/admin/manageInstructor.js');
const managingStudent = require('./routes/admin/manageStudent.js');

//authentication
const authRoutes = require('./routes/auth/auth.js');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    next();
});

app.get('/', async (req, res, next) => {
    return res.json({ "message": "Hello World" });
})
//authenticate
app.use('/auth', authRoutes);

//course router
app.use('/courses', courseRouter);

//teacher
app.use("/teacher", teacherRoutes);

//student
app.use("/student", studentRoutes);

// admin
app.use("/admin/course", managingCourseAdmin);
app.use("/admin/instructor", managingInstructor);
app.use('/admin/student', managingStudent);

mongoose.connect(MONGODB_URL).then(result => {
    app.listen(3000, () => {
        console.log('App is listening on port 3000');
    })
}).catch(err => {
    console.log(err);
})