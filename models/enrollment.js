const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    course: {
        type: mongoose.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    student: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Student'
    }
})

module.exports = mongoose.model('Enrollment', orderSchema);