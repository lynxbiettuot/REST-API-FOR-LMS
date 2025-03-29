const mongoose = require('mongoose');
const Course = require('../../models/courses.js');

//getFull Course
exports.getFullCourse = (req, res, next) => {
    Course.find().then(courses => {
        console.log(courses);
        res.json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
    })
}


//get a course
exports.getCourseDetail = (req, res, next) => {
    const courseId = req.params.courseId;
    Course.findById(courseId).then(result => {
        res.json({ "statusCode": 200, "message": "selected", "course": result });
    }).catch(err => {
        console.log(err);
    })
}