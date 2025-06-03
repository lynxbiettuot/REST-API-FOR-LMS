const express = require('express');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();

const bcrypt = require('bcrypt');

const studentController = require('./controllers/student/course.js')
app.post('/student/webhook', express.raw({ type: 'application/json' }), studentController.handleWebhook);

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
const User = require('./models/users.js');

//manage course by lecturer
const teacherRoutes = require('./routes/teacher/courses.js');
const teacherProfileRoutes = require('./routes/teacher/teacher-profile.js');
//student Routes 
const studentRoutes = require('./routes/student/student.js');
const studentProfileRoutes = require('./routes/student/student-profile.js');
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
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.get('/', async (req, res, next) => {
    const courseList = await Course.find({ pendingStatus: "approved" }, 'title description price').populate({ path: 'instructor', select: 'name' });
    return res.status(200).json({ "message": "Success", "coursesData": courseList });
})
//authenticate
app.use('/auth', authRoutes);

//course router
app.use('/courses', courseRouter);

//teacher
app.use("/teacher", teacherRoutes);
app.use('/teacher/profile', teacherProfileRoutes);

//student
app.use("/student", studentRoutes);
app.use("/student/profile", studentProfileRoutes)
app.get('/student/checkout/success', (req, res) => {
    res.send(`<h1>Thanh toán thành công!</h1><p>Session ID:</p>`);
});

app.get('/student/checkout/cancel', (req, res) => {
    res.send('<h1>Thanh toán đã bị hủy.</h1>');
});


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