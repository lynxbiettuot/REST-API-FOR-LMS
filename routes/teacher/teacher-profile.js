const express = require('express');

const app = express();

const router = express.Router();

const instructorController = require('../../controllers/teacher/teacher-profile.js');

//multer
const multer = require('multer');
//storage at memories
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

//auth function
const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get instructor profile
router.get('/', isAuth, instructorController.getInstructorProfile);

//update instructor profile
router.post('/update-instructor-profile', isAuth, authorize(['update:profile:own']), upload.single('uploaded_file'), instructorController.changeInstructorProfile);

module.exports = router;