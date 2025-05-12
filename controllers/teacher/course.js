const mongoose = require('mongoose');

const Course = require('../../models/courses.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');
const Video = require('../../models/video.js');

const { ObjectId } = require('mongodb');

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
    const courses = await Instruction.findById(req.instId).populate("createdCourse");
    res.status(200).json({ "statusCode": 200, "message": 'Completed retrieve', "course": courses })
}

//get a course by id
exports.getCourse = async (req, res, next) => {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId).populate("instructor").populate("videoLists");
    if (!course) {
        return res.status(404).json({ "message": "Course is not found!" });
    }
    res.status(200).json({ "statusCode": 200, "message": 'Completed retrieve', "courseData": course })
}

//create a course
exports.createCourse = async (req, res, next) => {
    try {
        if (!req.userRole !== 'Instructor') {
            return res.status(401).json({ "message": "Not permitted" });
        }
        const instructorId = req.instId;

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
    //check if not owner
    try {
        const courseId = req.params.courseId;
        const updateCourse = await Course.findById(courseId);
        if (!updateCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }
        //another instructor change current instructor course
        if (updateCourse.instructor.toString() !== req.instId.toString()) {
            return res.status(401).json({ "message": "Not permitted!" });
        }
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
    //check if not owner
    try {
        const courseId = req.params.courseId;
        //Add a step to find creator by courseId

        const deleteCourse = await Course.findById(courseId);
        if (!deleteCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }
        //another instructor change current instructor course
        if (deleteCourse.instructor.toString() !== req.instId.toString()) {
            return res.status(401).json({ "message": "Not permitted!" });
        }

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

//create & upload video base on courseId
exports.createAVideo = async (req, res, next) => {
    //check if not course's owner
    const courseId = req.params.courseId;
    const courseOwnerId = await Course.findById(courseId);
    if (courseOwnerId.instructor.toString() !== req.instId.toString()) {
        return res.status(401).json({ "message": "Not permitted to add video" });
    }

    const titleVideo = req.body.titleVideo;
    const videoURL = req.file;
    const videoDescription = req.body.videoDescription;

    const bucketName = 'videosbucket-01';
    const currentTime = Date.now();
    try {
        await handleUpdateFile(req, bucketName, currentTime);
        const tailUrl = `${currentTime}-${req.file.originalname}`;
        const videoUrl = `https://videosbucket-01.s3.ap-southeast-1.amazonaws.com/${tailUrl}`;
        const videoLists = await Course.findById(courseId).videoLists;
        const currentVideo = new Video({
            title: titleVideo,
            urlVideo: videoUrl,
            videoDescription: videoDescription,
            uploadDate: Date.now()
        })
        await currentVideo.save();
        await Course.findByIdAndUpdate(
            courseId,
            { $push: { videoLists: currentVideo._id } },
            { new: true }
        );
        const courseVideos = await Course.findById(courseId).populate('videoLists');
        return res.json({ "message": "Upload successed!", "courseVideoUrls": courseVideos });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Internal error" });
    }
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

//edit video base on courseId(both use for Admin)
exports.editAVideo = async (req, res, next) => {
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    if (currentCourse.instructor.toString() !== req.instId.toString()) {
        return res.status(401).json({ "message": "Not permitted to edit video" });
    }

    //new information to edit video
    const titleVideo = req.body.titleVideo;
    const videoURL = req.file;
    const videoDescription = req.body.videoDescription;

    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return res.status(404).json({ "message": "Not found!" });
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
    res.status(200).json({ "Message": "Updated", "videoData": "updateData" })
}

//delete video base on courseId(both use for Admin)
exports.deleteAVideo = async (req, res, next) => {
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    if (currentCourse.instructor.toString() !== req.instId.toString()) {
        return res.status(401).json({ "message": "Not permitted to edit video" });
    }

    const currentVideo = await Video.findById(videoId);
    //delete in course array
    await Course.updateOne(
        { _id: courseId }, // Lọc theo ID khóa học
        { $pull: { videoLists: videoId } } // Xóa videoId khỏi mảng videoLists
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
        console.log(error);
        res.status(500).json({ "message": "Interal error" });
    }
}