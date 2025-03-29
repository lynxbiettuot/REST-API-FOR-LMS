const express = require('express');

const app = express();

const router = express.Router();

const instructorManaging = require('../../controllers/admin/teacher.js');

//get full instruction
router.get('/', instructorManaging.getFullInstructor);

//get an instruction
router.get('/:instructorId', instructorManaging.getAnInstructor)

//edit an instruction
router.put('/update-instructor/:instructorId', instructorManaging.editAnInstruction);

//create an instruction
router.post('/create-instructor', instructorManaging.addNewInstructor);

//delete an instruction
router.delete('/delete-instructor/:instructorId', instructorManaging.deleteInstructor);

module.exports = router;