//model
const Instructor = require("../models/instruction.js")
const User = require('../models/users.js');

const handlePendingInstructor = async (req, res, next) => {
    if (req.userRole === "Instructor") {
        const instructorId = req.instId;
        const currentInstructor = await Instructor.findById(instructorId);

        const pendingStatus = currentInstructor.pendingStatus;
        if (pendingStatus === "pending" || pendingStatus === "rejected" || pendingStatus === undefined) {
            return res.status(403).json({ "message": "Your request is in pening or not approved", "pendingStatus": pendingStatus });
        }
    }
    next();
}

module.exports = handlePendingInstructor