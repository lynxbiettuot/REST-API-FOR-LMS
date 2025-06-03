//model
const Admin = require('../../models/admin.js');

exports.getFullprofileAdmin = async (req, res, next) => {
    const adminId = req.adminId;
    const adminProfile = await Admin.findById(adminId).populate('fullCourse').populate('instructor').populate('student');
    return res.status(200).json({ "message": "Success!", "adminData": adminProfile });
}

