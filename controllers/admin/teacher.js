const express = require('express');
const mongoose = require('mongoose');

//Model
const Instruction = require('../../models/instruction.js');
const Admin = require('../../models/admin.js');
const Course = require('../../models/courses.js');
const User = require('../../models/users.js');

//get full Instructor
exports.getFullInstructor = async (req, res, next) => {
    try {
        const listInstruction = await Instruction.find();
        res.status(200).json({ "message": "Completed retrieved", listInstruction: listInstruction });
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
        const adminId = data.adminId;
        const newInstructor = new Instruction({
            name: name,
            email: email,
            password: password,
            createdCourse: newCourses
        });
        //save to Instruction model
        await newInstructor.save();
        //save to Admin model
        await Admin.findByIdAndUpdate(
            adminId,
            { $push: { instructor: newInstructor._id } },
            { new: true }
        );

        //save to user model
        const newUser = new User({
            email: email,
            password: password,
            role: "Instructor"
        })
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

        currentInstructor.name = newName;
        currentInstructor.email = newEmail;
        currentInstructor.password = newPassword;

        currentUser.email = newEmail;
        currentUser.password = newPassword;

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