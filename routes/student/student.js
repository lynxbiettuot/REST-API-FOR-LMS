const express = require('express');
const app = express();

const router = express.Router();

const studentController = require('../../controllers/student/course.js');
//middleware
const isAuth = require('../../middleware/is-auth.js');
const instructorVerification = require('../../middleware/instructorVerification.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full course
router.get('/studying', isAuth, authorize(['course:read']), studentController.getFullCourse);

//get a course
router.get('/studying/course/:courseId', isAuth, authorize(['course:read']), studentController.getCourseDetail);

//get list video of a course if enroll is success
router.get('/studying/:courseId/watch', isAuth, authorize(['course:watch:video']), studentController.getListOfCourse);
//watch a video of a course
router.get('/studying/:courseId/watch/:videoId', isAuth, authorize(['course:watch:video']), studentController.watchVideoBaseOnCourseId);

//get full course in cart
router.get('/cart', isAuth, studentController.getCart);

//when student click on add to cart
router.post('/cart/add-to-cart/:courseId', isAuth, studentController.addACourseToCart);

//delete a course from cart
router.delete('/cart/delete-from-cart/:courseId', isAuth, studentController.deleteACourseFromCart);

//get checkout of course in cart
router.get('/checkout', isAuth, studentController.getCheckout);

//handle checkout and retrive payment event
router.post('/webhook', express.raw({ type: 'application/json' }), studentController.handleWebhook);


module.exports = router;