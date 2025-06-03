const express = require('express');
const app = express();

const router = express.Router();

const multer = require('multer');

//config for multer
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

const courseController = require('../../controllers/teacher/course.js');

//middleware
const isAuth = require('../../middleware/is-auth.js');
const instructorVerification = require('../../middleware/instructorVerification.js');
//Autorization
const authorize = require('../../middleware/rbac.js');

//get full course
router.get('/teaching', isAuth, instructorVerification, courseController.getFullCourse);

//get infor of a course
router.get('/teaching/:courseId', isAuth, instructorVerification, courseController.getCourse);

//create a course
router.post('/teaching/create-course', isAuth, instructorVerification, authorize(['course:create']), courseController.createCourse);

//update course
router.put('/teaching/update-course/:courseId', isAuth, instructorVerification, authorize(['course:update:own']), courseController.updateCourse);

//delete course
router.delete('/teaching/delete-course/:courseId', isAuth, instructorVerification, authorize(['course:delete:own']), courseController.deleteCourse);

//create a video
router.post('/teaching/:courseId/create', isAuth, instructorVerification, authorize(['course:delete:own']), upload.single('uploaded_file'), courseController.createAVideo);

//watch a video of a course
router.get('/teaching/:courseId/watch/:videoId', isAuth, instructorVerification, authorize(['course:watch:video']), courseController.watchVideoBaseOnCourseId);

//watch full list of video
router.get('/teaching/:courseId/watch', isAuth, instructorVerification, authorize(['course:watch:video']), courseController.getFullVideosOfACourse);

//update a video
router.put('/teaching/:courseId/edit/:videoId', isAuth, instructorVerification, authorize(['course:edit:video']), upload.single('upload_file'), courseController.editAVideo);

//delete a video
router.delete('/teaching/:courseId/delete/:videoId', isAuth, instructorVerification, authorize(['course:delete:video']), courseController.deleteAVideo);

//post excercise PDF
router.post('/teaching/:courseId/excercise/:videoId/create', isAuth, instructorVerification, upload.single('uploaded_file'), courseController.uploadExcercisePDF);

//get excercis PDF
router.get('/teaching/:courseId/excercise/:videoId', isAuth, instructorVerification, courseController.getExcercisePDF);

//get full Student in course
router.get('/teaching/:courseId/students', isAuth, instructorVerification, courseController.getListStudent)

//delete a student in a course
router.delete('/teaching/:courseId/delete/:studentId', isAuth, instructorVerification, courseController.deleteStudent);

module.exports = router;