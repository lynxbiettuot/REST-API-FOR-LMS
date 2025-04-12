const express = require('express');
const app = express();

const router = express.Router();

const studentController = require('../../controllers/student/course.js');
const isAuth = require('../../middleware/is-auth.js');

//get full course
router.get('/studying', isAuth, studentController.getFullCourse);

//get a course
router.get('/studying/course/:courseId', isAuth, studentController.getCourseDetail);

//enroll/register a course

module.exports = router;