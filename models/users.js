const { mongoose } = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    resetOtp: {
        type: String
    },
    otpExpiry: {
        type: Date
    }
})

module.exports = mongoose.model('User', userSchema);