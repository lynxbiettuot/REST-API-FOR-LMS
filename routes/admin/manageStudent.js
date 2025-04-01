const express = require('express');

const router = express.Router();

const studentManaging = require('../../controllers/admin/student.js');

//get full student
router.get('/', studentManaging.getFullStudent);

//get infor of a student
router.get('/:studentId', studentManaging.getStudent);

//create student
router.post('/create-student', studentManaging.createStudent);

//update student
router.put('/update-student/:studentId', studentManaging.editStudent);

//delete student
router.delete('/delete-student/:studentId', studentManaging.deleteStudent);

module.exports = router;