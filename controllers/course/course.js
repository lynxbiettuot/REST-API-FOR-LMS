const mongoose = require('mongoose');
const Course = require('../../models/courses.js');
const courses = require('../../models/courses.js');

//getFull Course
exports.getCourse = (req, res, next) => {
    Course.find().then(courses => {
        console.log(courses);
        res.json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
    })
}

//create a post
exports.createCourse = (req, res, next) => {
    console.log(req.body);
    const newCourse = new Course({
        name: req.body.name,
        price: req.body.price,
        lecture: req.body.lecture,
        url: req.body.url
    });
    newCourse.save().then(result => {
        console.log(result);
    })
    res.json({ "statusCode": 200, "message": "Created!" });
}

//update a course
exports.updateCourse = (req, res, next) => {
    const id = req.params.id;
    const newName = req.body.name;
    const newPrice = req.body.price;
    const newLecture = req.body.lecture;
    const newUrl = req.body.url
    Course.findById(id).then(currentCourse => {
        if (!currentCourse) {
            return res.json({ statusCode: 404, message: "Course not found" });
        }
        currentCourse.name = newName;
        currentCourse.price = newPrice;
        currentCourse.lecture = newLecture;
        currentCourse.url = newUrl;
        return currentCourse.save();
    }).then(result => {
        console.log('Updated!');
        res.json({ "statusCode": 200, "message": "updated!", "course": result });
    })
        .catch(err => {
            console.log(err);
        })
}

//delete a course
exports.deleteCourse = (req, res, next) => {
    const courseId = req.params.id;
    Course.findByIdAndDelete(courseId).then(() => {
        res.json({ "statusCode": 200, "message": 'Deleted' });
    }).catch(err => {
        console.log(error);
    })
}