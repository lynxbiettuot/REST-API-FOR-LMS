const mongoose = require('mongoose');

const { Schema } = mongoose;

const courseSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instruction'
    },
    student:
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        }],
    videoLists:
        [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Course', courseSchema);