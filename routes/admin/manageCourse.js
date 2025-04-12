const express = require('express');

const app = express();

const router = express.Router();

const courseManaging = require("../../controllers/admin/course.js");

const isAuth = require('../../middleware/is-auth.js');

//get full course
router.get('/', isAuth, courseManaging.getFullCourse);

//get a course
router.get('/:courseId', isAuth, courseManaging.getCourseDetail);

//create a course
router.post('/create-course', isAuth, courseManaging.createCourse);

//edit a course
router.put('/edit-course/:courseId', isAuth, courseManaging.updateCourse);

//delete a course
router.delete('/delete-course/:courseId', isAuth, courseManaging.deleteCourse);

module.exports = router;