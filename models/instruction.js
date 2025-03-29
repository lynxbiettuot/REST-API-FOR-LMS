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
    createdCourse: [{ type: mongoose.Types.ObjectId, ref: 'Course', required: true }],
})

module.exports = mongoose.model('Instruction', instructorSchema);

