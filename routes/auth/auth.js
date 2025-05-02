const express = require('express');

const authController = require('../../controllers/auth/auth.js');
const isAuthRoute = require('../../middleware/is-auth.js');

const router = express.Router();

//sign up
router.post('/signup', authController.signup);

//login
router.post('/login', authController.login);

//refreshToken
router.post('/refresh', authController.getAccessToken);

//send OTP via email
router.post('/send-otp', authController.handleSendOtp);

//reset password via OTP
router.post('/reset-password', authController.handleVerifyOtpAndResetPassword);

module.exports = router;
