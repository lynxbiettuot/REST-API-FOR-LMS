const mongoose = require('mongoose');

//model
const Course = require('../../models/courses.js');
const Admin = require('../../models/admin.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');
const User = require('../../models/users.js');

//get full list of student
exports.getFullStudent = async (req, res, next) => {
    try {
        const listStudent = await Student.find();
        if (!listStudent) {
            return res.status(404).json({ "message": "Not found!" });
        }
        res.status(200).json({ "message": "Completed!", "statusCode": 200, "listStudent": listStudent });
    } catch (err) {
        console.log(error);
        res.status(500).json({ "message": "Internal server!" });
    }
}

//get a student by Id;
exports.getStudent = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;
        const currentStudent = await Student.findById(studentId);
        if (!currentStudent) {
            return res.status(404).json({ "message": "Not found!" });
        }
        res.status(200).json({ "message": "Completed!", "statusCode": 200, "studentData": currentStudent });
    } catch (err) {
        console.log(err);
        res.status(500).json({ "message": "Internal server!" });
    }
}

//create a student
exports.createStudent = async (req, res, next) => {
    try {
        //save to Student model and Admin model
        const adminId = "68219d1c22f09394ae396648";
        const newName = req.body.name;
        const newEmail = req.body.email;
        const newPassword = req.body.password;
        const newCourse = [];
        const newStudent = new Student({
            name: newName,
            email: newEmail,
            password: newPassword,
            course: newCourse
        });

        //save to User model
        const newUser = new User({
            email: newEmail,
            password: newPassword,
            role: "Student"
        })

        await newUser.save();
        //save to Student Model
        await newStudent.save();

        await Admin.findByIdAndUpdate(
            adminId,
            { $push: { student: newStudent._id } },
            { new: true }
        );
        res.status(200).json({ "message": "created", "statusCode": 200, "newStudent": newStudent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal server!" });
    }
}

//edit a student
exports.editStudent = async (req, res, next) => {
    try {
        //save to Student model and Admin model
        const studentId = req.params.studentId;
        const newName = req.body.name;
        const newEmail = req.body.email;
        const newPassword = req.body.password;

        const updateStudent = await Student.findById(studentId);
        if (!updateStudent) {
            return res.status(404).json({ "message": "Not found!" });
        }

        const currentEmail = updateStudent.email;
        const currentUser = await User.findOne({ email: currentEmail.trim() });

        if (!currentUser) {
            return res.status(404).json({ "message": "User not found!" });
        }

        updateStudent.name = newName;
        updateStudent.email = newEmail;
        updateStudent.password = newPassword;

        //save to Student Model
        await updateStudent.save();

        currentUser.email = newEmail;
        currentUser.password = newPassword;
        await currentUser.save();

        res.status(200).json({ "message": "created", "statusCode": 200, "updateStudent": updateStudent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal server!" });
    }
}

//delete a student
exports.deleteStudent = async (req, res, next) => {
    try {
        //save to Student model and Admin model
        const studentId = req.params.studentId;
        const currentStudent = await Student.findById(studentId);
        if (!currentStudent) {
            return res.status(404).json({ "message": "Not found", "statusCode": 404 })
        }

        const currentEmail = currentStudent.email;
        const currentUser = await User.findOne({ email: currentEmail });
        if (!currentUser) {
            return res.status(404).json({ "message": "Not found", "statusCode": 404 });
        }

        await User.deleteOne({ email: currentUser.email });

        await Student.findByIdAndDelete(studentId);

        await Admin.updateOne(
            {},
            { $pull: { student: studentId } }
        );

        await Course.updateMany({ student: studentId },
            { $pull: { student: studentId } })

        res.status(200).json({ "message": "Deleted", "deleteData": currentStudent });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal server!" });
    }
}
