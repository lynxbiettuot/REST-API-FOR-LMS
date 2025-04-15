const express = require('express');
const app = express();

const router = express.Router();

const studentController = require('../../controllers/student/course.js');
const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full course
router.get('/studying', isAuth, authorize(['course:read']), studentController.getFullCourse);

//get a course
router.get('/studying/course/:courseId', isAuth, authorize(['course:read']), studentController.getCourseDetail);

//enroll/register a course

module.exports = router;