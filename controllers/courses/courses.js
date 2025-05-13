const mongoose = require('mongoose');
const Course = require('../../models/courses.js');

//option to sort
const sortByCriterial = require('../../utils/sortingCourse.js');
const { search } = require('../../routes/teacher/courses.js');

//getFull Course
exports.getFullCourse = async (req, res, next) => {
    const queries = req.query;
    const name = queries.sortBy;
    const order = queries.orderBy;
    const minCost = queries.minCost;
    const maxCost = queries.maxCost;
    let coursesData = await Course.find();
    if (minCost && maxCost) {
        coursesData = coursesData.filter((singleCourse) => { return singleCourse.price >= minCost && singleCourse.price <= maxCost });
    }
    let sortOption = {};
    if (name && order) {
        sortOption = sortByCriterial(name, order);
    }
    const courses = await coursesData.sort(sortOption);
    // console.log(courses);
    return res.json({ "message": "Okay", "courseData": courses });
}

//get many courses by searching
exports.getSearchingCourses = async (req, res, next) => {
    const searchTarget = req.query.search || '';
    const courses = await Course.find({
        title: { $regex: searchTarget, $options: 'i' }
    });
    if (!courses) {
        return res.status(200).json({ "message": "No courses matched!" });
    }
    return res.status(200).json({ "coursesData": courses, "message": "Compeleted!" });
}