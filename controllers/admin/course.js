const mongoose = require('mongoose');

const Course = require('../../models/courses.js');
const Admin = require('../../models/admin.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');

//getFull Course
exports.getFullCourse = (req, res, next) => {
    Course.find().then(courses => {
        console.log(courses);
        res.json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
    })
}

//get a course detail
exports.getCourseDetail = (req, res, next) => {
    const courseId = req.params.courseId;
    Course.findById(courseId).then(result => {
        res.json({ "statusCode": 200, "message": "selected", "course": result });
    }).catch(err => {
        console.log(err);
    })
}

//create a course
exports.createCourse = async (req, res, next) => {
    try {
        console.log(req.body);
        const adminId = new mongoose.Types.ObjectId("67e6fcf4c2de2359117877a1");
        const instructorId = new mongoose.Types.ObjectId("67e5191106151ec3dd1ccd3f");

        const newCourse = new Course({
            title: req.body.title,
            description: req.body.description,
            instructor: null,
            price: req.body.price
        });

        const savedCourse = await newCourse.save();

        await Admin.findByIdAndUpdate(
            adminId,
            { $push: { fullCourse: savedCourse._id } },
            { new: true }
        );

        res.status(200).json({ "statusCode": 200, "message": "Created!", "course": savedCourse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "statusCode": 500, "message": "Internal Server Error" });
    }
}

//edit a course
exports.updateCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const updateCourse = await Course.findById(courseId);
        const data = req.body;

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
        console.log(courseId);

        await Instruction.updateMany(
            { createdCourse: courseId },
            { $pull: { createdCourse: courseId } }
        );

        await Student.updateMany(
            { course: courseId },
            { $pull: { course: courseId } }
        );

        await Admin.updateMany(
            { fullCourse: courseId },
            { $pull: { fullCourse: courseId } }
        );

        await Course.findByIdAndDelete(courseId);

        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error!", error });
    }
}