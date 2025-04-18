const mongoose = require('mongoose');
const Course = require('../../models/courses.js');

//option to sort
const sortByCriterial = require('../../utils/sortingCourse.js');

//getFull Course
exports.getFullCourse = async (req, res, next) => {
    const queries = req.query;
    const name = queries.sortBy;
    const order = queries.orderBy;
    const minCost = queries.minCost;
    const maxCost = queries.maxCost;
    let coursesData = await Course.find();
    coursesData = coursesData.filter((singleCourse) => { return singleCourse.price >= minCost && singleCourse.price <= maxCost });
    let sortOption = {};
    if (name && order) {
        sortOption = sortByCriterial(name, order);
    }
    const courses = await coursesData.sort(sortOption);
    // console.log(courses);
    return res.json({ "message": "Okay", "courseData": courses });
}