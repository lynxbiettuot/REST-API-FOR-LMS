//model
const Student = require('../../models/student.js');
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

exports.getStudentProfile = async (req, res, next) => {
    const currentStudentId = req.stuId;
    const currentProfile = await Student.findById(currentStudentId).populate('course');
    res.status(200).json({ "message": "Completed", "studentData": currentProfile });
}

exports.changeStudentProfile = async (req, res, next) => {
    const newName = req.body.name;
    const newAvatarUrl = req.file;
    const contactEmail = req.body['contact.email'];
    const contactPhone = req.body['contact.phone'];

    try {
        const currentTime = Date.now();
        await handleUpdateFile(req, "imagesbucket-01", currentTime);
        const tailUrl = `${currentTime}-${req.file.originalname}`;
        //get image url from S3 bucket
        const avatarUrl = `https://imagesbucket-01.s3.ap-southeast-1.amazonaws.com/${tailUrl}`;
        const currentStudent = await Student.findOne({ email: req.userEmail.trim() });
        if (!currentStudent) {
            return res.status(404).json({ "message": "Notfound", "statusCode": 404 });
        }
        //Don't need to check User because if token is available, User is usually exist
        currentStudent.name = newName;
        currentStudent.email = contactEmail;
        currentStudent.phoneNumber = contactPhone;
        currentStudent.avatarUrl = avatarUrl;

        const updatedData = await currentStudent.save();

        //Update User model
        const currentUser = await User.findOne({ email: req.userEmail });
        currentUser.email = contactEmail;
        await currentUser.save();
        console.log(updatedData);
        return res.status(200).json({ "message": "Data is updated", "updatedData": updatedData });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ "message": "Internal server error!" });
    }
}