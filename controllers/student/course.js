const mongoose = require('mongoose');

//model
const Course = require('../../models/courses.js');
const Enrollment = require('../../models/enrollment.js');
const Student = require('../../models/student.js');
const Video = require('../../models/video.js');

//use .env variable
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_KEY);

async function updateCourse(courseId, studentId) {
    await Course.findByIdAndUpdate(courseId,
        { $push: { student: studentId } },
        { new: true })
}

async function updateStudent(studentId, courseId) {
    await Student.findByIdAndUpdate(studentId,
        { $push: { course: courseId } },
        { new: true })
}


//getFull Course
exports.getFullCourse = async (req, res, next) => {
    const studentId = req.stuId;
    const currentStudent = await Student.findById(studentId).populate('course');
    const currentCourse = currentStudent.course;
    return res.status(200).json({ "message": "Success!", "courseData": currentCourse });
}

//get a course
exports.getCourseDetail = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId).populate({ path: 'videoLists', select: 'title videoDescription' });
    if (!currentCourse) {
        return res.status(404).json({ "message": "Course is not exist!" });
    }
    return res.status(200).json({ "message": "Success", "courseData": currentCourse });
}

//get list of video in a course
exports.getListOfCourse = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId).populate({ path: 'videoLists', select: 'title videoDescription' });
    if (!currentCourse) {
        return res.stus(404).json({ "message": "Course not found" });
    }
    return res.status(200).json({ "message": "Successed!", "courseData": currentCourse });
}

//watch a video
exports.watchVideoBaseOnCourseId = async (req, res, next) => {
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const studentId = req.stuId;
    console.log(videoId);
    console.log(courseId);
    console.log(studentId);
    if (!studentId) {
        return res.status(403).json({ "message": "You're not student" });
    }
    const currentEnrollment = await Enrollment.find({ "course": courseId, "student": studentId });//return an array
    if (currentEnrollment.length == 0) {
        return res.status(403).json({ "message": "You are not permitted to wach video" });
    }
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return res.status(404).json({ "message": "Video is not found!" });
    }
    return res.status(200).json({ "message": "Okay!", "videoInfo": currentVideo });
}

//get cart 
exports.getCart = async (req, res, next) => {
    const currentStudentId = req.stuId;
    if (!currentStudentId) {
        return res.status(403).json({ "message": "You're not permitted to get cart!" });
    }
    const currentStudent = await Student.findById(currentStudentId).populate({
        path: 'cart.items.courseId',
        populate: {
            path: 'instructor',
            select: 'name'
        }
    });
    const cartData = currentStudent.cart.items;
    res.status(200).json({ "message": "Completed retrieve data", "cartData": cartData });
}

//add a course to cart
exports.addACourseToCart = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    if (!currentCourse) {
        return res.status(404).json({ "message": "Course is not found!" });
    }
    const currentStudent = await Student.findById(req.stuId);
    const result = await currentStudent.addToCart(currentCourse);
    if (result === undefined) {
        return res.status(409).json({ "message": "Course is already in the cart!" });
    }
    res.status(200).json({ "message": "Course is added to cart" });
}

//delete a course from cart
exports.deleteACourseFromCart = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentStudent = await Student.findById(req.stuId);
    await currentStudent.removeFromCart(courseId);
    res.status(200).json({ "message": "Course is deleted from cart" });
}

exports.getCheckout = async (req, res, next) => {
    const cartOwnerId = req.stuId;
    if (!cartOwnerId) {
        return res.status(401).json({ "message": "You're not permitted to get cart!" });
    }
    const currentOwner = await Student.findById(cartOwnerId).populate({
        path: 'cart.items.courseId',
        populate: {
            path: 'instructor',
            select: 'name'
        }
    });
    if (!currentOwner) {
        return res.status(404).json({ "message": "Cart's owner is not found!" });
    }
    const listCourses = currentOwner.cart.items;
    let totalCost = 0;
    let coursesForPayment = listCourses;
    let listIdCourse = []
    listCourses.forEach((singleCourse) => {
        totalCost += singleCourse.courseId.price;
        listIdCourse.push(singleCourse.courseId._id.toString());
    })
    // create a payment session in stripe
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: coursesForPayment.map((course) => {
            return {
                price_data: {
                    product_data: {
                        name: course.courseId.title,
                        description: course.courseId.description,
                    },
                    unit_amount: course.courseId.price * 100,
                    currency: 'usd',
                },
                quantity: 1
            }
        }),
        mode: 'payment',
        payment_intent_data: {
            metadata: {
                studentId: `${req.stuId}`,
                courseIds: JSON.stringify(listIdCourse),
            }
        },
        success_url: "http://localhost:3000/student/checkout/success",
        cancel_url: "http://localhost:3000/student/checkout/cancel",
    });

    res.json({ "message": "Created session", "paymentUrl": session.url, "idPayment": session.id });
}

exports.handleWebhook = async (request, response, next) => {
    let event = request.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    let endpointSecret = "whsec_fbc5183a63a972aa3e28096f4426051b4bb0fbcd36b82b6e32c672cf580d2afa";
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
        } catch (err) {
            console.log(`Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }
    }
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        if (paymentIntent.status === 'succeeded') {
            //save to Order Schema
            const courseIds = JSON.parse(paymentIntent.metadata.courseIds);
            const studentId = paymentIntent.metadata.studentId;
            const successUser = await Student.findById(studentId);
            successUser.clearCart();
            courseIds.forEach(async (courseId) => {
                updateCourse(courseId, studentId);
                updateStudent(studentId, courseId);
                const newEnrollment = new Enrollment({
                    course: courseIds,
                    student: studentId
                })
                await newEnrollment.save();
            })
        }
    }

    response.status(200).send();
}


