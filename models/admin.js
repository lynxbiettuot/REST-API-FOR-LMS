const { mongoose } = require('mongoose');

const { Schema } = mongoose;

const adminSchema = new Schema({
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
    fullCourse: [{ type: mongoose.Types.ObjectId, ref: 'Course' }],
    instructor: [{ type: mongoose.Types.ObjectId, ref: 'Instruction' }],
    student: [{ type: mongoose.Types.ObjectId, ref: 'Student' }]
})

module.exports = mongoose.model('Admin', adminSchema);