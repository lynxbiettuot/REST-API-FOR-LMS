const mongoose = require('mongoose');

const { Schema } = mongoose;

const instructorSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdCourse: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Course' }],
})

module.exports = mongoose.model('Instruction', instructorSchema);

