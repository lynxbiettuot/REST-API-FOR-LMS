const express = require('express');

const app = express();

const router = express.Router();

const courseManaging = require("../../controllers/admin/course.js");

//get full course
router.get('/course', courseManaging.getFullCourse);

//get a course
router.get('/course/:courseId', courseManaging.getCourseDetail);

//create a course
router.post('/course/create-course', courseManaging.createCourse);

//edit a course
router.put('/course/edit-course/:courseId', courseManaging.updateCourse);

//delete a course
router.delete('/course/delete-course/:courseId', courseManaging.deleteCourse);

module.exports = router;