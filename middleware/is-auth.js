const jwt = require('jsonwebtoken');

//model
const Student = require('../models/student.js');
const Instructor = require('../models/instruction.js');
const Admin = require('../models/admin.js');


//config to use .env variable
require('dotenv').config();

module.exports = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return res.status(401).json({ "message": "Not authenticated!" })
    }
    const [typeToken, accessToken] = authHeader.split(' ');
    let decodedToken;
    try {
        decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        return res.status(500).json({ "message": "Not authenticated!" });
    }
    console.log(decodedToken);
    if (!decodedToken) {
        return res.status(401).json({ "message": "Not authenticated!" });
    }
    const userRole = decodedToken.role;
    const userEmail = decodedToken.email;
    req.userRole = userRole;
    req.userEmail = userEmail;

    // get infor base on role
    if (userRole === 'Student') {
        const student = await Student.findOne({ email: userEmail });
        req.stuId = student ? student._id : null;
    } else if (userRole === 'Instructor') {
        const instructor = await Instructor.findOne({ email: userEmail });
        req.instId = instructor ? instructor._id : null;
    } else if (userRole === 'Admin') {
        const admin = await Admin.findOne({ email: userEmail });
        req.adminId = admin ? admin._id : null;
    }
    next();
}