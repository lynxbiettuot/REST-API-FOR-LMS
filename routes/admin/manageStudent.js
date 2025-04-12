const express = require('express');

const router = express.Router();

const studentManaging = require('../../controllers/admin/student.js');

const isAuth = require('../../middleware/is-auth.js');

//get full student
router.get('/', isAuth, studentManaging.getFullStudent);

//get infor of a student
router.get('/:studentId', isAuth, studentManaging.getStudent);

//create student
router.post('/create-student', isAuth, studentManaging.createStudent);

//update student
router.put('/update-student/:studentId', isAuth, studentManaging.editStudent);

//delete student
router.delete('/delete-student/:studentId', isAuth, studentManaging.deleteStudent);

module.exports = router;