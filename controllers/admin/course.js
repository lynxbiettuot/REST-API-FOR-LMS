const mongoose = require('mongoose');

const Course = require('../../models/courses.js');
const Admin = require('../../models/admin.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');
const Video = require('../../models/video.js');
const Excercise = require('../../models/excercise.js');

//aws
const {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
    paginateListObjectsV2,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");

//function to handle upload video
async function handleUpdateFile(req, bucketName, currentTime) {
    //created an user for S3 service
    const s3Client = new S3Client({});

    //create AWS bucket
    // await s3Client.send(
    //     new CreateBucketCommand({
    //         Bucket: bucketName,
    //     }),
    // );

    //put an object to AWS bucket
    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: `${currentTime}-${req.file.originalname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ContentDisposition: 'inline',
        }),
    );
}

//function to delete video
async function handleDeleteFile(req, bucketName, videoTime) {
    const s3Client = new S3Client({});
    const bucketParams = { Bucket: `${bucketName}`, Key: `${videoTime}` };
    await s3Client.send(new DeleteObjectCommand(bucketParams));
}

//getFull Course
exports.getFullCourse = async (req, res, next) => {
    if (!req.adminId) {
        return res.status(403).json({ "message": "Not permitted to get full course" });
    }
    const courses = await Course.find({ pendingStatus: "approved" }, { title: 1, description: 1, price: 1 }).populate({ path: 'instructor', select: 'name' });
    res.json({ "statusCode": 200, "message": 'Completed retrieve', "courses": courses })
}

//get a course detail
exports.getCourseDetail = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const currentCourse = await Course.findById(courseId).populate({ path: 'instructor', select: 'name description' }).populate({ path: 'videoLists', select: 'title videoDescription' });
        if (!currentCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }
        res.json({ "statusCode": 200, "message": "selected", "course": currentCourse });
    } catch (err) {
        return res.status(500).json({ "message": "Internal server" });
    }
}

//create a course
exports.createCourse = async (req, res, next) => {
    try {
        //only one Admin
        if (!req.adminId) {
            return res.status(401).json({ "message": "You are not exist to create course!" });
        }
        const adminId = req.adminId;

        const newCourse = new Course({
            title: req.body.title,
            description: req.body.description,
            instructor: null,
            price: req.body.price,
            pendingStatus: "approved"
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
        if (!updateCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }
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
        //Add a step to find creator by courseId

        const deleteCourse = await Course.findById(courseId).populate("videoLists");
        const currentVideoLists = deleteCourse.videoLists;
        if (!deleteCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }

        // another instructor change current instructor course
        if (req.userRole !== "Admin") {
            return res.status(401).json({ "message": "Not permitted!" });
        }

        //delete all video of a course before delete this course
        const bucketName = 'videosbucket-01';

        //delete all videos of a course
        currentVideoLists.forEach(async (currentVideo) => {
            const keyObject = currentVideo.urlVideo.split('.amazonaws.com/')[1];
            //excercise
            const excerciseId = currentVideo.excerciseUrl;
            if (excerciseId) {
                await Excercise.findOneAndDelete({ _id: excerciseId });
            }
            //on aws
            await handleDeleteFile(req, bucketName, keyObject);
            //on Schema Video
            await Video.deleteOne({ _id: currentVideo._id });
            //on course array
            await Course.updateOne(
                { _id: courseId },
                { $pull: { videoLists: currentVideo._id } }
            );
        })

        //delete course in Instruction
        await Instruction.updateMany(
            { createdCourse: courseId },
            { $pull: { createdCourse: courseId } }
        );

        //delete course in Student if enrolled
        await Student.updateMany(
            { course: courseId },
            { $pull: { course: courseId } }
        );
        await Course.findByIdAndDelete(courseId);

        const adminId = "68219d1c22f09394ae396648";

        await Admin.findByIdAndUpdate(
            adminId,
            { $pull: { fullCourse: courseId } },
            { new: true }
        );

        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error!", error });
    }
}

//Admin edit a video in a course base on course Id
exports.editAVideo = async (req, res, next) => {
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    if (req.userRole === "Admin") {
        const videoId = req.params.videoId;
        //new information to edit video
        const titleVideo = req.body.titleVideo;
        const videoURL = req.file;
        const videoDescription = req.body.videoDescription;

        const currentVideo = await Video.findById(videoId);
        if (!currentVideo) {
            return res.status(404).json({ "message": "Not found video!" });
        }
        let videoUrl = undefined;
        if (videoURL) {
            const bucketName = 'videosbucket-01';

            //delete item on bucket
            const keyObject = currentVideo.urlVideo.split('.amazonaws.com/')[1];
            const currentTime = Date.now();
            handleDeleteFile(req, bucketName, keyObject);

            //re-upload new video
            handleUpdateFile(req, bucketName, currentTime);

            const tailUrl = `${currentTime}-${req.file.originalname}`;
            videoUrl = `https://videosbucket-01.s3.ap-southeast-1.amazonaws.com/${tailUrl}`;
        }
        currentVideo.title = titleVideo;
        currentVideo.videoDescription = videoDescription;
        if (videoUrl !== undefined) {
            currentVideo.urlVideo = videoUrl;
        }
        currentVideo.uploadDate = Date.now();
        const updateData = await currentVideo.save();
        return res.status(200).json({ "message": "Updated", "videoData": updateData })
    }
    return res.status(401).json({ "message": "Not permitted to edit video" });
}
//delete a video in a course base on course Id
exports.deleteAVideo = async (req, res, next) => {
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    // if (currentCourse.instructor.toString() !== req.instId.toString()) {
    //     return res.status(401).json({ "message": "Not permitted to edit video" });
    // }

    if (req.userRole === "Admin") {
        const currentVideo = await Video.findById(videoId);

        const excerciseId = currentVideo.excerciseUrl;

        await Excercise.findOneAndDelete({ _id: excerciseId });

        //delete in course array
        await Course.updateOne(
            { _id: courseId },
            { $pull: { videoLists: videoId } }
        );
        if (!currentVideo) {
            return res.status(404).json({ "message": "Not found!" });
        }
        const bucketName = 'videosbucket-01';

        //delete item on bucket
        const keyObject = currentVideo.urlVideo.split('.amazonaws.com/')[1];
        try {
            //delete on AWS
            handleDeleteFile(req, bucketName, keyObject);
            await Video.deleteOne({ _id: videoId });
            return res.status(200).json({ "message": "Deleted!" })
        } catch (err) {
            console.log(err);
            res.status(500).json({ "message": "Interal error" });
        }
    }
    return res.status(401).json({ "message": "Not permitted to delete video" });
}

//get list of pending course
exports.getListPendingCourse = async (req, res, next) => {
    const currentCourse = await Course.find();
    const pendingCourse = currentCourse.filter(course => course.pendingStatus === "pending");
    res.status(200).json({ "message": "Successed!", "pendingCourse": pendingCourse });
}

//handle instructor pending approve
exports.handlePendingCourseRequest = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId.trim());
    if (!currentCourse) {
        return res.status(404).json({ "message": "Course is not found!" });
    }
    currentCourse.pendingStatus = "approved";
    await currentCourse.save();
    res.status(200).json({ "message": "Course is approved!" });
}

//reject instructor pending request
exports.rejectPendingCourseRequest = async (req, res, next) => {
    const courseId = req.params.courseId;
    const userId = req.params.instructorId;
    const currentCourse = await Course.findById(courseId);
    if (!currentCourse) {
        return res.status(404).json({ "message": "Course is not found!" });
    }
    if (currentCourse.pendingStatus === "approved") {
        return res.status(403).json({ "message": "Course is already approved!" });
    }
    await Course.findByIdAndDelete(courseId);
    await Instruction.findByIdAndUpdate(
        { _id: userId },
        { $pull: { createdCourse: courseId } }
    )
    const adminId = "68219d1c22f09394ae396648";
    await Admin.findByIdAndUpdate(
        { _id: adminId },
        { $pull: { createdCourse: courseId } }
    )
    res.status(200).json({ "message": "Admin rejected your course request!" });
}