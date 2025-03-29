const express = require('express');

const app = express();

const router = express.Router();

const courseManaging = require("../../controllers/admin/course.js");

//get full course
router.get('/', courseManaging.getFullCourse);

//get a course
router.get('/:courseId', courseManaging.getCourseDetail);

//create a course
router.post('/create-course', courseManaging.createCourse);

//edit a course
router.put('/edit-course/:courseId', courseManaging.updateCourse);

//delete a course
router.delete('/delete-course/:courseId', courseManaging.deleteCourse);

module.exports = router;