const mongoose = require('mongoose');

const { Schema } = mongoose;

const courseSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    lecture: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Course', courseSchema);