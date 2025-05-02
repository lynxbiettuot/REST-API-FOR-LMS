const express = require('express');

const router = express.Router();

const coursesController = require('../../controllers/courses/courses.js');

//get full course
router.get('/', coursesController.getFullCourse);

//search many courses by name
router.get('/search', coursesController.getSearchingCourses);

module.exports = router;