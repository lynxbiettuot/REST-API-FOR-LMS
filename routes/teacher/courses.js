const express = require('express');
const app = express();

const router = express.Router();

const courseController = require('../../controllers/teacher/course.js');

const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full course
router.get('/teaching', isAuth, courseController.getFullCourse);

//get infor of a course
router.get('/teaching/:courseId', isAuth, courseController.getCourse);

//create post
router.post('/teaching/create-course', isAuth, authorize(['course:create']), courseController.createCourse);

//update course
router.put('/teaching/update-course/:courseId', isAuth, authorize(['course:update:own']), courseController.updateCourse);

//delete course
router.delete('/teaching/delete-course/:courseId', isAuth, authorize(['course:delete:own']), courseController.deleteCourse);

module.exports = router;