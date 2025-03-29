const express = require('express');
const mongoose = require('mongoose');

//Model
const Instruction = require('../../models/instruction.js');
const Admin = require('../../models/admin.js');

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
            return res.status(404).json({ "message": "Not found" });
        }
        const data = req.body;
        const newEmail = data.email;
        const newPassword = data.password;
        const newName = data.name;
        currentInstructor.name = newName;
        currentInstructor.email = newEmail;
        currentInstructor.password = newPassword;
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
        const instructorId = req.params.id;
        const instructor = await Instruction.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        await Course.updateMany(
            { instructor: req.params.id },
            { $unset: { instructor: "" } }
        );

        await Instruction.findByIdAndDelete(req.params.id);

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