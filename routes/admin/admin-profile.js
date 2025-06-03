const express = require('express');

const app = express();

const router = express.Router();

const adminProfileController = require('../../controllers/admin/admin-profile');

//get admin profile
router.get('/admin-profile', adminProfileController.getFullprofileAdmin);

module.exports = router;