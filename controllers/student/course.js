const mongoose = require('mongoose');

//model
const Course = require('../../models/courses.js');
const Enrollment = require('../../models/enrollment.js');
const Student = require('../../models/student.js');
const student = require('../../models/student.js');
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
    // if (result === undefined) {
    //     return res.status(409).json({ "message": "Course is already in the cart!" });
    // }
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
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
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
            courseIds.forEach((courseId) => {
                console.log(courseId);
                updateCourse(courseId, studentId);
                updateStudent(studentId, courseId)
            })
        }
    }
    // switch (event.type) {
    //     case 'payment_intent.succeeded':
    //         const paymentIntent = event.data.object;
    //         console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
    //         // Then define and call a method to handle the successful payment intent.
    //         // handlePaymentIntentSucceeded(paymentIntent);
    //         break;
    //     case 'payment_method.attached':
    //         const paymentMethod = event.data.object;
    //         // Then define and call a method to handle the successful attachment of a PaymentMethod.
    //         // handlePaymentMethodAttached(paymentMethod);
    //         break;
    //     default:
    //         // Unexpected event type
    //         console.log(`Unhandled event type ${event.type}.`);
    // }

    // Return a 200 response to acknowledge receipt of the event
    response.status(200).send();
}

//get full list of video
exports.getFullVideosOfACourse = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId).populate('videoLists');
    if (!currentCourse) {
        return res.stus(404).json({ "message": "Course not found" });
    }
    return res.status(200).json({ "message": "Successed!", "courseData": currentCourse });
}

//watch a video base on courseId(both use for Admin)
exports.watchVideoBaseOnCourseId = async (req, res, next) => {
    //check if  Admin or owner or Student enroll can watch
    const videoId = req.params.videoId;
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return res.status(404).json({ "message": "Not found!" });
    }
    return res.status(200).json({ "message": "Retrieved success!", "courseVideoUrl": currentVideo });
}


