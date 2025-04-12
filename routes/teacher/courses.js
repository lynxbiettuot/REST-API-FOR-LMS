const express = require('express');
const app = express();

const router = express.Router();

const courseController = require('../../controllers/teacher/course.js');

const isAuth = require('../../middleware/is-auth.js');

//get full course
router.get('/teaching', isAuth, courseController.getFullCourse);

//get infor of a course
router.get('/teaching/:courseId', isAuth, courseController.getCourse);

//create post
router.post('/teaching/create-course', isAuth, courseController.createCourse);

//update course
router.put('/teaching/update-course/:courseId', isAuth, courseController.updateCourse);

//delete course
router.delete('/teaching/delete-course/:courseId', isAuth, courseController.deleteCourse);

module.exports = router;