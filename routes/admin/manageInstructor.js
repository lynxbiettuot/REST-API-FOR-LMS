const express = require('express');

const app = express();

const router = express.Router();

const instructorManaging = require('../../controllers/admin/teacher.js');

const isAuth = require('../../middleware/is-auth.js');

//get full instruction
router.get('/', isAuth, instructorManaging.getFullInstructor);

//get an instruction
router.get('/:instructorId', isAuth, instructorManaging.getAnInstructor)

//create an instruction
router.post('/create-instructor', isAuth, instructorManaging.addNewInstructor);

//edit an instruction
router.put('/update-instructor/:instructorId', isAuth, instructorManaging.editAnInstruction);

//delete an instruction
router.delete('/delete-instructor/:instructorId', isAuth, instructorManaging.deleteInstructor);

module.exports = router;