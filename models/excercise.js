const mongoose = require('mongoose');

const { Schema } = mongoose;

const excerciseSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    excerciseUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Excercise', excerciseSchema);