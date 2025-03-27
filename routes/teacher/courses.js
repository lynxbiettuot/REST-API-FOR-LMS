const express = require('express');
const app = express();

const router = express.Router();

const courseController = require('../../controllers/teacher/course.js');

//get full course
router.get('/teaching', courseController.getFullCourse);

//get infor of a course
router.get('/teaching/:courseId', courseController.getCourse);

//create post
router.post('/teaching/create-course', courseController.createCourse);

//update course
router.put('/teaching/update-course/:courseId', courseController.updateCourse);

//delete course
router.delete('/teaching/delete-course/:courseId', courseController.deleteCourse);

module.exports = router;