const express = require('express');
const app = express();

const router = express.Router();

const studentController = require('../../controllers/student/course.js');

//get full course
router.get('/studying', studentController.getFullCourse);

//get a course
router.get('/studying/course/:courseId', studentController.getCourseDetail)


module.exports = router;