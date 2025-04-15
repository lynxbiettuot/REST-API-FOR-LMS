const express = require('express');

const router = express.Router();

const studentManaging = require('../../controllers/admin/student.js');

const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full student
router.get('/', isAuth, authorize(['user:read']), studentManaging.getFullStudent);

//get infor of a student
router.get('/:studentId', isAuth, authorize(['user:read']), studentManaging.getStudent);

//create student
router.post('/create-student', isAuth, authorize(['user:create']), studentManaging.createStudent);

//update student
router.put('/update-student/:studentId', isAuth, authorize(['user:update']), studentManaging.editStudent);

//delete student
router.delete('/delete-student/:studentId', isAuth, authorize(['user:delete']), studentManaging.deleteStudent);

module.exports = router;