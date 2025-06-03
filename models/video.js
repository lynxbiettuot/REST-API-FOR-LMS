const mongoose = require('mongoose');

const { Schema } = mongoose;

const videoSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    urlVideo: {
        type: String,
        required: true
    },
    videoDescription: {
        type: String
    },
    uploadDate: {
        type: Date,
        default: Date.now()
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    excerciseUrl: {
        type: Schema.Types.ObjectId,
        ref: 'Excercise'
    }
});

module.exports = mongoose.model('Video', videoSchema);