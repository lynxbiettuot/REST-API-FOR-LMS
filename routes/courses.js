const express = require('express');
const app = express();

const router = express.Router();

const courseController = require('../controllers/course/course.js');

//get course
router.get('/course', courseController.getCourse);

//create post
router.post('/create-course', courseController.createCourse);

//update course
router.put('/update-course/:id', courseController.updateCourse);

//delete course
router.delete('/delete-course/:id', courseController.deleteCourse);

module.exports = router;