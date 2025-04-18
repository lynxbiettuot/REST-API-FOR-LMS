const express = require('express');

const router = express.Router();

const coursesController = require('../../controllers/courses/courses.js');

router.get('/', coursesController.getFullCourse);

module.exports = router;