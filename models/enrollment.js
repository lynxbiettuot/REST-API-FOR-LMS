const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    courses: [
        {
            course: { type: mongoose.Types.ObjectId, ref: 'Course', required: true }
        }
    ],
    student: {
        email: { type: String, required: true },
        studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' }
    }
})

module.exports = mongoose.model('Enrollment', orderSchema);