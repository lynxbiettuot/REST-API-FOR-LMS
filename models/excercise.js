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
    excerciseUrl: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Excercise'
    }
});

module.exports = mongoose.model('Excercise', courseSchema);