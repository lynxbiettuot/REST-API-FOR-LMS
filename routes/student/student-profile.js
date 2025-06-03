const express = require('express');

const app = express();

const router = express.Router();

const studentController = require('../../controllers/student/student-profile.js')

//multer
const multer = require('multer');
//storage at memories
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

//auth function
const isAuth = require('../../middleware/is-auth.js');
const instructorVerification = require('../../middleware/instructorVerification.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//view profile
router.get('/', isAuth, studentController.getStudentProfile);

//update instructor profile
router.put('/update-student-profile', isAuth, instructorVerification, authorize(['update:profile:own']), upload.single('uploaded_file'), studentController.changeStudentProfile);

module.exports = router;