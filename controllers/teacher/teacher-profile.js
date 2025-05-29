//model
const Instructor = require('../../models/instruction.js');
const User = require('../../models/users.js');

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

exports.changeInstructorProfile = async (req, res, next) => {
    const newName = req.body.name;
    const newAvatarUrl = req.file;
    const newDescription = req.body.bio;
    const contactEmail = req.body['contact.email'];
    const contactPhone = req.body['contact.phone'];

    try {
        const currentTime = Date.now();
        await handleUpdateFile(req, "imagesbucket-01", currentTime);
        const tailUrl = `${currentTime}-${req.file.originalname}`;
        //get image url from S3 bucket
        const avatarUrl = `https://imagesbucket-01.s3.ap-southeast-1.amazonaws.com/${tailUrl}`;
        console.log(req.userEmail);
        const currentInstructor = await Instructor.findOne({ email: req.userEmail.trim() });
        if (!currentInstructor) {
            return res.status(404).json({ "message": "Notfound", "statusCode": 404 });
        }
        //Don't need to check User because if token is available, User is usually exist
        currentInstructor.name = newName;
        currentInstructor.email = contactEmail;
        currentInstructor.phoneNumber = contactPhone;
        currentInstructor.avatarUrl = avatarUrl;
        currentInstructor.description = newDescription;

        const updatedData = await currentInstructor.save();

        //Update User model
        const currentUser = await User.findOne({ email: req.userEmail });
        currentUser.email = contactEmail;
        await currentUser.save();
        return res.status(200).json({ "message": "Data is updated", "updatedData": updatedData });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ "message": "Internal server error!" });
    }

    // const s3ImageUrl = 

    //oke
    // console.log(newName);
    // console.log(newDescription);
    // console.log(newAvatarUrl);
    // console.log(contactEmail);
    // console.log(contactPhone);

    // const currentUser = await Instructor.findOne({ email: contactEmail });
    // if (!currentUser) {
    //     return res.status(404).json({ "message": "Not found!" });
    // }
    // currentUser.name = newName;
    // currentUser.email = contactEmail;
    // currentUser.phoneNumber = contactPhone;
    // currentUser.avatarUrl = newAvatarUrl;
    // currentUser.description = newDescription;

    // const updatedProfile = await currentUser.save();
    return res.json({ "message": "Updated", "data": "updatedProfile " });
}

//get instructor profile
exports.getInstructorProfile = async (req, res, next) => {
    const currentInstructorId = req.instId;
    const currentInstructor = await Instructor.findById(currentInstructorId).populate('createdCourse');
    if (!currentInstructor) {
        return res.status(404).json({ "message": "Instructor is not found!" });
    }
    return res.status(200).json({ "message": "Success", "instructorData": currentInstructor });
}