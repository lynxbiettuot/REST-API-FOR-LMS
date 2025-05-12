const mongoose = require('mongoose');

const { Schema } = mongoose;

const instructorSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
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
    phoneNumber: {
        type: String,
        require: true
    },
    avatarUrl: {
        type: String
    },
    description: {
        type: String
    },
    createdCourse: [{ type: mongoose.Types.ObjectId, ref: 'Course', required: true }],
    pending: {
        type: Boolean,
        default: true,
        required: true
    }
})

module.exports = mongoose.model('Instruction', instructorSchema);

