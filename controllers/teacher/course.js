const mongoose = require('mongoose');

const Course = require('../../models/courses.js');
const Instruction = require('../../models/instruction.js');
const Student = require('../../models/student.js');
const Video = require('../../models/video.js');
const Admin = require('../../models/admin.js');
const Excercise = require('../../models/excercise.js');

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
async function handleDeleteFile(req, bucketName, videoKey) {
    const s3Client = new S3Client({});
    const bucketParams = { Bucket: `${bucketName}`, Key: `${videoKey}` };
    await s3Client.send(new DeleteObjectCommand(bucketParams));
}


//getFull Course of owner
exports.getFullCourse = async (req, res, next) => {
    const currentInstructor = await Instruction.findById(req.instId).populate('createdCourse');
    const fullCourse = currentInstructor.createdCourse;
    res.status(200).json({ "statusCode": 200, "message": 'Completed retrieved!', "course": fullCourse })
}

//get a course by id
exports.getCourse = async (req, res, next) => {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId).populate("instructor").populate({ path: "videoLists", select: "title videoDescription" });
    if (!course) {
        return res.status(404).json({ "message": "Course is not found!" });
    }

    if (course.pendingStatus === "pending") {
        return res.status(403).json({ "message": "Course is in pending status" });
    }

    res.status(200).json({ "statusCode": 200, "message": 'Completed retrieve', "courseData": course })
}

//create a course
exports.createCourse = async (req, res, next) => {
    try {
        if (req.userRole !== 'Instructor') {
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

        const adminId = "68219d1c22f09394ae396648";

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
        if (updateCourse.instructor === null || (updateCourse.instructor.toString() !== req.instId.toString())) {
            return res.status(401).json({ "message": "Not permitted!" });
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
    //check if not owner
    try {
        const courseId = req.params.courseId;
        //Add a step to find creator by courseId

        const deleteCourse = await Course.findById(courseId).populate("videoLists");

        if (!deleteCourse) {
            return res.status(404).json({ "message": "Course is not found!" });
        }
        const currentVideoLists = deleteCourse.videoLists;
        //another instructor change current instructor course
        if (deleteCourse.instructor === null || (deleteCourse.instructor.toString() !== req.instId.toString())) {
            return res.status(401).json({ "message": "Not permitted!" });
        }

        //delete all video of a course before delete this course
        const bucketName = 'videosbucket-01';

        //delete all videos of a course
        if (currentVideoLists.length > 0) {
            currentVideoLists.forEach(async (currentVideo) => {
                const keyObject = currentVideo.urlVideo.split('.amazonaws.com/')[1];
                //delete excercise
                const excerciseId = currentVideo.excerciseUrl;
                await Excercise.findOneAndDelete({ _id: excerciseId });
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
        }

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
        console.log(error);
        res.status(500).json({ message: "Internal Server", error });
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

    if (courseOwnerId.pendingStatus === "pending") {
        return res.status(403).json({ "message": "Your course is in pending status" });
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
        const currentVideo = new Video({
            title: titleVideo,
            urlVideo: videoUrl,
            videoDescription: videoDescription,
            uploadDate: Date.now(),
            course: courseId
        })
        await currentVideo.save();
        await Course.findByIdAndUpdate(
            courseId,
            { $push: { videoLists: currentVideo._id } },
            { new: true }
        );
        const courseVideos = await Course.findById(courseId).populate('videoLists');
        const result = courseVideos.videoLists;
        return res.json({ "message": "Upload successed!", "courseData": result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Internal error" });
    }
}

//get full list of video
exports.getFullVideosOfACourse = async (req, res, next) => {
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId).populate({ path: 'videoLists', select: "title videoDescription" });

    if (!currentCourse) {
        return res.stus(404).json({ "message": "Course not found" });
    }

    const listOfVideo = currentCourse.videoLists;
    return res.status(200).json({ "message": "Successed!", "courseData": listOfVideo });
}

//watch a video base on courseId(both use for Admin)
exports.watchVideoBaseOnCourseId = async (req, res, next) => {
    //check if  Admin or owner or Student enroll can watch
    const videoId = req.params.videoId;
    const courseId = req.params.courseId;
    const currentCourse = await Course.findById(courseId);
    if (currentCourse.instructor === null || currentCourse.instructor.toString() !== req.instId.toString()) {
        return res.status(403).json({ "message": "you're not permitted to watch video" });
    }

    const currentVideo = await Video.findById(videoId);
    if (!currentVideo) {
        return res.status(404).json({ "message": "Not found!" });
    }
    return res.status(200).json({ "message": "Instructor retrieved success!", "courseVideoUrl": currentVideo });
}

//edit video base on courseId(both use for Admin)
exports.editAVideo = async (req, res, next) => {
    try {
        const videoId = req.params.videoId;
        const courseId = req.params.courseId;
        const currentCourse = await Course.findById(courseId);
        //another instructor change current instructor course
        if (currentCourse.instructor === null || (currentCourse.instructor.toString() !== req.instId.toString())) {
            return res.status(401).json({ "message": "Not permitted!" });
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
        res.status(200).json({ "message": "Updated", "videoData": updateData })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Internal server" });
    }
}

//delete video base on courseId(both use for Admin)
exports.deleteAVideo = async (req, res, next) => {
    try {
        const videoId = req.params.videoId;
        const courseId = req.params.courseId;
        const currentCourse = await Course.findById(courseId);
        if (currentCourse.instructor === null || currentCourse.instructor.toString() !== req.instId.toString()) {
            return res.status(401).json({ "message": "Not permitted to delete video" });
        }

        const currentVideo = await Video.findById(videoId);
        console.log(currentVideo);
        //delete excercise in video
        const excerciseId = currentVideo.excerciseUrl;
        if (excerciseId) {
            await Excercise.findOneAndDelete({ _id: excerciseId });
        }

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
        //delete on AWS
        handleDeleteFile(req, bucketName, keyObject);
        await Video.deleteOne({ _id: videoId });
        return res.status(200).json({ "message": "Deleted!" })
    } catch (err) {
        console.log(err);
        res.status(500).json({ "message": "Interal error" });
    }
}

//upload excercise PDF
exports.uploadExcercisePDF = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const excerciseURL = req.file;
        const title = req.body.title
        const courseOwnerId = await Course.findById(courseId);
        const videoId = req.params.videoId;

        if (courseOwnerId.instructor === null || courseOwnerId.instructor.toString() !== req.instId.toString()) {
            return res.status(401).json({ "message": "Not permitted to add excercise" });
        }
        const bucketName = 'imagesbucket-01';
        const currentTime = Date.now();
        await handleUpdateFile(req, bucketName, currentTime);
        const tailUrl = `${currentTime}-${req.file.originalname}`;
        const excerciseUrl = `https://imagesbucket-01.s3.ap-southeast-1.amazonaws.com/${tailUrl}`;
        const newExcercise = new Excercise({
            title: title,
            excerciseUrl: excerciseUrl
        });

        await newExcercise.save();

        await Video.findByIdAndUpdate(
            videoId,
            { excerciseUrl: newExcercise._id },
            { new: true }
        );
        return res.status(200).json({ "message": "Upload successed!" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Internal error" });
    }
}

//get excercise PDF
exports.getExcercisePDF = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const videoId = req.params.videoId;
        const currentCourse = await Course.findById(courseId);
        if (currentCourse.instructor === null || currentCourse.instructor.toString() !== req.instId.toString()) {
            return res.status(403).json({ "message": "you're not permitted to get excercise" });
        }
        const currentVideo = await Video.findById(videoId).populate({ path: 'excerciseUrl', select: "title excerciseUrl" });

        if (!currentVideo) {
            return res.status(404).json({ "message": "Not found!" });
        }
        const excerciseUrl = currentVideo.excerciseUrl;
        if (!excerciseUrl) {
            return res.status(404).json({ "message": "Not found!" });
        }
        return res.status(200).json({ "message": "Retrieved success!", "excerciseUrl": excerciseUrl });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ "message": "Internal server!" });
    }
}

//get list of student in a course
exports.getListStudent = async (req, res, next) => {
    const courseId = req.params.courseId;
    const instructorId = req.instId;
    const currentCourse = await Course.findById(courseId).populate('student');
    if (currentCourse.instructor === null || currentCourse.instructor.toString() !== instructorId) {
        return res.status(403).json({ "message": "Not permitted to get list of student" });
    }
    const listStudent = currentCourse.student;
    return res.status(200).json({ "message": "Success!", "listStudent": listStudent });
}

//delete a sudent from a course
exports.deleteStudent = async (req, res, next) => {
    const studentId = req.params.studentId;
    const courseId = req.params.courseId;
    const instructorId = req.instId;
    const currentCourse = await Course.findById(courseId);
    if (currentCourse.instructor === null || currentCourse.instructor.toString() !== instructorId) {
        return res.status(403).json({ "message": "Not permitted to get list of student" });
    }
    await Course.updateOne(
        { _id: courseId },
        { $pull: { students: studentId } }
    );

    return res.status(200).json({ message: "Student removed from course successfully" });
}