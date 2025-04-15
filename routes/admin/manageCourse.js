const express = require('express');

const app = express();

const router = express.Router();

const courseManaging = require("../../controllers/admin/course.js");

const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full course
router.get('/', isAuth, authorize(['course:read']), courseManaging.getFullCourse);

//get a course
router.get('/:courseId', isAuth, authorize(['course:read']), courseManaging.getCourseDetail);

//create a course
router.post('/create-course', isAuth, authorize(['course:create']), courseManaging.createCourse);

//edit a course
router.put('/edit-course/:courseId', isAuth, authorize(['course:update:any']), courseManaging.updateCourse);

//delete a course
router.delete('/delete-course/:courseId', isAuth, authorize(['course:delete:any']), courseManaging.deleteCourse);

module.exports = router;