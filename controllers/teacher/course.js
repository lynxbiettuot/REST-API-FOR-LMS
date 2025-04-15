const mongoose = require('mongoose');

const Course = require('../../models/courses.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');

const { ObjectId } = require('mongodb');

//getFull Course
exports.getFullCourse = (req, res, next) => {
    Course.find().populate("instructor").then(courses => {
        console.log(courses);
        res.status(200).json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
    })
}

//get a course by id
exports.getCourse = (req, res, next) => {
    const courseId = req.params.courseId;
    Course.findById(courseId).populate("instructor").then(courses => {
        console.log(courses);
        res.status(200).json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
    })
}

//create a post
exports.createCourse = async (req, res, next) => {
    try {
        console.log(req.body);
        const instructorId = new mongoose.Types.ObjectId("67e5191106151ec3dd1ccd3f");

        const newCourse = new Course({
            title: req.body.title,
            description: req.body.description,
            instructor: instructorId,
            price: req.body.price
        });

        const savedCourse = await newCourse.save();

        await Instruction.findByIdAndUpdate(
            instructorId,
            { $push: { createdCourse: savedCourse._id } },
            { new: true }
        );

        res.status(200).json({ "statusCode": 200, "message": "Created!", "course": savedCourse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "statusCode": 500, "message": "Internal Server Error" });
    }
}

//update a course
exports.updateCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const updateCourse = await Course.findById(courseId);
        const data = req.body;
        console.log(data);
        const newTile = data.title;
        const description = data.description;
        const price = data.price;
        updateCourse.title = newTile;
        updateCourse.description = description;
        updateCourse.price = price;
        const result = await updateCourse.save();
        res.status(200).json({ "statusCode": 200, "message": "Updated!", "updatedCourse": result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "statusCode": 500, "message": "Internal Server Error" });
    }
}

//delete a course
exports.deleteCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        //Add a step to find creator by courseId

        await Instruction.updateMany(
            { createdCourse: courseId },
            { $pull: { createdCourse: courseId } }
        );

        await Student.updateMany(
            { course: courseId },
            { $pull: { course: courseId } }
        );
        await Course.findByIdAndDelete(courseId);

        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
}