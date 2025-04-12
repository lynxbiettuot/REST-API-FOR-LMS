const express = require('express');

const authController = require('../../controllers/auth/auth.js');
const isAuthRoute = require('../../middleware/is-auth.js');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/refresh', authController.getAccessToken);

module.exports = router;
