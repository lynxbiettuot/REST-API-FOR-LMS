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

//function to handle upload image
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

//create a course
exports.createCourse = async (req, res, next) => {
    try {
        const instructorId = new mongoose.Types.ObjectId("67fac9939ed2c8e69fa3bd58");

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

//create & upload video base on courseId
exports.createAVideo = async (req, res, next) => {
    const titleVideo = req.body.titleVideo;
    const videoURL = req.file;
    const videoDescription = req.body.videoDescription;
    const courseId = req.params.courseId;

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

//watch video base on courseId(both use for Admin)
exports.watchVideoBaseOnCourseId = async (req, res, next) => {
    const courseId = req.params.courseId;
    const videoId = req.params.videoId;
    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return res.status(404).json({ "message": "Not found!" });
    }
    return res.status(200).json({ "message": "Retrieved success!", "courseVideoUrl": currentVideo });
}
//edit video base on courseId(both use for Admin)

//delete video base on courseId(both use for Admin)
