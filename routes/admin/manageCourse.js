const express = require('express');

const app = express();

const router = express.Router();

const courseManaging = require("../../controllers/admin/course.js");

const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//multer to handle video
const multer = require('multer');

//config for multer
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });


//handling pending when Instructor post an request to create a course

//get pendingCourse
router.get('/pending', isAuth, authorize(['handle:request']), courseManaging.getListPendingCourse);

// handling pending course
router.get('/pending/:instructorId/:courseId/approve', isAuth, authorize(['handle:request']), courseManaging.handlePendingCourseRequest);

// reject pending course
router.get('/pending/:instructorId/:courseId/reject', isAuth, authorize(['handle:request']), courseManaging.rejectPendingCourseRequest);

//get full course
router.get('/', isAuth, authorize(['course: read']), courseManaging.getFullCourse);

//get a course
router.get('/:courseId', isAuth, authorize(['course:read']), courseManaging.getCourseDetail);

//create a course
router.post('/create-course', isAuth, authorize(['course:create']), courseManaging.createCourse);

//edit a course
router.put('/edit-course/:courseId', isAuth, authorize(['course:update:any']), courseManaging.updateCourse);

//edit a video in a course
router.put('/edit/:courseId/edit-video/:videoId', isAuth, authorize(['course:edit:video']), upload.single('upload_file'), courseManaging.editAVideo);

//delete a video in a course
router.delete('/delete/:courseId/delete-video/:videoId', isAuth, authorize(['course:edit:video']), upload.single('upload_file'), courseManaging.deleteAVideo);

//delete a course
router.delete('/delete-course/:courseId', isAuth, authorize(['course:delete:any']), courseManaging.deleteCourse);

module.exports = router;