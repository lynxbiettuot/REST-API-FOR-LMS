const express = require('express');
const mongoose = require('mongoose');

//Model
const Instruction = require('../../models/instruction.js');
const Admin = require('../../models/admin.js');
const Course = require('../../models/courses.js');
const User = require('../../models/users.js');

const bcrypt = require('bcrypt');

//attach an instructor to a course with instructor = null
exports.attachInstructor = async (req, res, next) => {
    const courseId = req.params.courseId;
    const instructorId = req.body.instructorId;
    if (!req.adminId) {
        return res.status(403).json({ "message": "Forbidden to modify course!" });
    }

    const currentCourse = await Course.findById(courseId);
    const currentInstructor = await Instruction.findById(instructorId);
    if (currentCourse.instructor === null) {
        return res.status(403).json({ "message": "Course is already had instructor" });
    }
    currentInstructor.createdCourse.push(courseId);
    currentCourse.instructor = instructorId;
    await currentCourse.save();
    await currentInstructor.save();
    return res.status(200).json({ "message": "Complete updated" });
}

//get full Instructor
exports.getFullInstructor = async (req, res, next) => {
    try {
        const listInstruction = await Instruction.find().populate({ path: 'createdCourse', select: 'title' });
        res.status(200).json({ "message": "Completed retrieved", "listInstructor": listInstruction });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "statusCode": 500, "message": "Internal server" });
    }
}

//get an Instructor
exports.getAnInstructor = async (req, res, next) => {
    try {
        const instructorId = req.params.instructorId;
        const currentInstructor = await Instruction.findById(instructorId).populate('createdCourse');
        if (!currentInstructor) {
            return res.status(404).json({ "message": "Not found" });
        }
        res.status(200).json({ "message": "Compeleted retrieved", "statusCode": 200, "currentInstructor": currentInstructor });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal error" })
    }
}

//add an Instructor
exports.addNewInstructor = async (req, res, next) => {
    try {
        const data = req.body;
        const name = data.name;
        const email = data.email;
        const password = data.password;
        const newCourses = [];
        const adminId = "68219d1c22f09394ae396648";
        const hashedPassword = await bcrypt.hash(password, 12);

        //save to user model
        const newUser = new User({
            email: email,
            password: hashedPassword,
            role: "Instructor"
        })

        const newInstructor = new Instruction({
            name: name,
            userId: newUser._id,
            email: email,
            password: hashedPassword,
            createdCourse: newCourses,
            pendingStatus: "approved"
        });
        //save to Instruction model
        await newInstructor.save();
        //save to Admin model
        await Admin.findByIdAndUpdate(
            adminId,
            { $push: { instructor: newInstructor._id } },
            { new: true }
        );
        await newUser.save();

        res.status(201).json({ "statusCode": 201, "message": "Created", "data": newInstructor });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal error" })
    }
}

//edit an Instructor
exports.editAnInstruction = async (req, res, next) => {
    try {
        const instructorId = req.params.instructorId;
        const currentInstructor = await Instruction.findById(instructorId);

        if (!currentInstructor) {
            return res.status(404).json({ "message": "Instructor not found" });
        }
        const currentEmail = currentInstructor.email;
        const currentUser = await User.findOne({ email: currentEmail.trim() });

        if (!currentUser) {
            return res.status(404).json({ "message": "User not found" });
        }
        const data = req.body;
        const newEmail = data.email;
        const newPassword = data.password;
        const newName = data.name;

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        //update Instructor Schema
        currentInstructor.name = newName;
        currentInstructor.email = newEmail;
        currentInstructor.password = hashedPassword;

        //update User Schema
        currentUser.email = newEmail;
        currentUser.password = hashedPassword;

        //save in user model
        await currentUser.save();

        const updateData = await currentInstructor.save();
        res.status(200).json({ "statusCode": 200, "message": "updated!", "data": updateData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal error" })
    }
}

//delete an Instructor
exports.deleteInstructor = async (req, res, next) => {
    try {
        const instructorId = req.params.instructorId;
        const instructor = await Instruction.findById(req.params.instructorId);
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        const currentEmail = instructor.email;
        const currentUser = await User.findOne({ email: currentEmail.trim() });
        if (!currentUser) {
            return res.status(404).json({ "message": "Account not found" });
        }

        await User.deleteOne({ email: currentUser.email.trim() });

        await Course.updateMany(
            { instructor: instructorId },
            { $unset: { instructor: null } }
        );

        await Instruction.findByIdAndDelete(instructorId);

        await Admin.updateOne(
            {},
            { $pull: { instructor: instructorId } }
        );

        res.status(200).json({ message: "Instructor deleted, courses updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//get instructor pending request
exports.getListPendingInstructor = async (req, res, next) => {
    const currentInstructors = await Instruction.find();
    let instArray = [];//to push instructor with pending status
    currentInstructors.forEach((instructor) => {
        if (instructor.pendingStatus === "pending") {
            instArray.push(instructor);
        }
    })
    res.status(200).json({ "message": "Successed!", "pendingInstructor": instArray });
}

//handle instructor pending approve
exports.handlePendingRequest = async (req, res, next) => {
    const instructorId = req.params.instructorId;
    const currentInstructor = await Instruction.findById(instructorId.trim());
    if (!currentInstructor) {
        return res.status(404).json({ "message": "Instructor is not found!" });
    }
    currentInstructor.pendingStatus = "approved";
    await currentInstructor.save();
    res.status(200).json({ "message": "Instructor is approved!" });
}

//reject instructor pending request
exports.rejectPendingRequest = async (req, res, next) => {
    const instructorId = req.params.instructorId;
    const currentInstructor = await Instruction.findById(instructorId.trim());
    if (!currentInstructor) {
        return res.status(404).json({ "message": "Instructor is not found!" });
    }
    if (currentInstructor.pendingStatus === "approved") {
        return res.status(403).json({ "message": "Instructor is aready approved" });
    }
    const userInstructorId = currentInstructor.userId;
    await Instruction.findByIdAndDelete(instructorId);
    //refer to instructor account on user model and delete
    await User.findByIdAndDelete(userInstructorId);

    const adminId = "68219d1c22f09394ae396648"
    //delete on admin
    await Admin.findByIdAndUpdate(
        adminId,
        { $pull: { instructor: instructorId } },
        { new: true }
    );
    res.status(200).json({ "message": "Instructor rejected your request!" });
}

