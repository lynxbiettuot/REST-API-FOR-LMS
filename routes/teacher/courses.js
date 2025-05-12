const express = require('express');
const app = express();

const router = express.Router();

const multer = require('multer');

//config for multer
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

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

//create a video
router.post('/teaching/:courseId/create', isAuth, authorize(['course:delete:own']), upload.single('uploaded_file'), courseController.createAVideo);

//watch a video of a course
router.get('/teaching/:courseId/watch/:videoId', isAuth, authorize(['course:watch:video']), courseController.watchVideoBaseOnCourseId);

//watch full list of video
router.get('/teaching/:courseId/watch', isAuth, authorize(['course:watch:video']), courseController.getFullVideosOfACourse);

//update a video
router.put('/teaching/:courseId/edit/:videoId', isAuth, authorize(['course:edit:video']), upload.single('upload_file'), courseController.editAVideo);

//delete a video
router.delete('/teaching/:courseId/delete/:videoId', isAuth, authorize(['course:delete:video']), courseController.deleteAVideo);

module.exports = router;