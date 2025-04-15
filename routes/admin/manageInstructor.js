const express = require('express');

const app = express();

const router = express.Router();

const instructorManaging = require('../../controllers/admin/teacher.js');

const isAuth = require('../../middleware/is-auth.js');

//Autorization
const authorize = require('../../middleware/rbac.js');

//get full instruction
router.get('/', isAuth, authorize(['user:read']), instructorManaging.getFullInstructor);

//get an instruction
router.get('/:instructorId', isAuth, authorize(['user:read']), instructorManaging.getAnInstructor)

//create an instruction
router.post('/create-instructor', isAuth, authorize(['user:create']), instructorManaging.addNewInstructor);

//edit an instruction
router.put('/update-instructor/:instructorId', isAuth, authorize(['user:update']), instructorManaging.editAnInstruction);

//delete an instruction
router.delete('/delete-instructor/:instructorId', authorize(['user:delete']), isAuth, instructorManaging.deleteInstructor);

module.exports = router;