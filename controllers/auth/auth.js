const bcrypt = require('bcrypt');

//Model
const Student = require('../../models/student.js');
const Instructor = require('../../models/instruction.js');
const Admin = require('../../models/admin.js');
const instruction = require('../../models/instruction.js');

const jwt = require('jsonwebtoken');

require('dotenv').config();

//signup
exports.signup = async (req, res, next) => {
    try {
        console.log(req.body);
        const email = req.body.email;
        const password = req.body.password;
        const confrimPassword = req.body.confirmPassword;
        const fullName = req.body.fullName;
        const phoneNumber = req.body.phoneNumber;
        const role = req.body.role;
        const adminId = "67e6fcf4c2de2359117877a1";

        const curObj = { email: email };

        const existStudent = await Student.findOne(curObj);
        const existInstructor = await instruction.findOne(curObj);
        if (existInstructor || existStudent) {
            return res.status(400).json({ "message": "Account had already existed!", "statusCode": 400 });
        }

        if (password !== confrimPassword) {
            return res.status(400).json({ "message": "Confirm password is not valid", "statusCode": 400 });
        }
        //hashing
        const hashedPassword = await bcrypt.hash(password, 12);
        let dataReply = null;
        if (role === "Student") {
            const newStudent = new Student({
                name: fullName,
                email: email,
                password: hashedPassword,
                phoneNumber: phoneNumber,
                course: []
            })
            dataReply = await newStudent.save();
            await Admin.findByIdAndUpdate(
                adminId,
                { $push: { student: dataReply._id } },
                { new: true }
            );
        } else if (role === "Instructor") {
            const newInstructor = new Instructor({
                name: fullName,
                email: email,
                password: hashedPassword,
                phoneNumber: phoneNumber,
                createdCourse: []
            });
            dataReply = await newInstructor.save();
            await Admin.findByIdAndUpdate(
                adminId,
                { $push: { instructor: dataReply._id } },
                { new: true }
            );
        }
        res.status(200).json({ "message": "Register success!", "data": dataReply });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

//login
exports.login = async (req, res, next) => {
    const userEmail = req.body.email;
    const userPassword = req.body.password;
    console.log(process.env.ACCESS_TOKEN_SECRET);
    console.log(process.env.REFRESH_TOKEN_SECRET);
    let canFind = 0;
    console.log(req.body);
    //find in Instructor model
    let currentInstructor = await Instructor.findOne({ email: userEmail });
    if (currentInstructor) {
        let isEqual = await bcrypt.compare(userPassword, currentInstructor.password);
        if (isEqual) {
            canFind = 1;
            const accessToken = jwt.sign(
                {
                    email: currentInstructor.email,
                    userId: currentInstructor._id.toString()
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                {
                    email: currentInstructor.email,
                    userId: currentInstructor._id.toString()
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            // Assigning refresh token in http-only cookie 
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                sameSite: 'None', secure: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.status(200).json({ "message": "success", "statusCode": 200, "accessToken": accessToken, "refreshToken": refreshToken, "userData": currentInstructor, "role": "Instructor" });
        }
    }

    //find in Strudent Model
    let currentStudent = await Student.findOne({ email: userEmail });
    if (currentStudent) {
        let isEqual = await bcrypt.compare(userPassword, currentStudent.password);
        if (isEqual) {
            canFind = 1;
            const accessToken = jwt.sign(
                {
                    email: currentStudent.email,
                    userId: currentStudent._id.toString()
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                {
                    email: currentStudent.email,
                    userId: currentStudent._id.toString()
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
            // Assigning refresh token in http-only cookie 
            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                sameSite: 'None', secure: true,
                maxAge: 24 * 60 * 60 * 1000
            });
            return res.status(200).json({ "message": "success", "statusCode": 200, "accessToken": accessToken, "refreshToken": refreshToken, "userData": currentStudent, "role": "Student" });
        }
    }
    return res.status(404).json({ "message": "Account not found!", "statusCode": 404 });
}

//get access token via refresh token
exports.getAccessToken = async (req, res, next) => {
    const currentUserEmail = req.body.email;
    const userId = req.body.userId;
    if (req.cookies.jwt) {
        // get token from cookie
        const currentRefreshToken = req.cookies.jwt;

        //Verify refresh token
        jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
            if (err) {
                // Wrong Refesh Token
                return res.status(406).json({ message: 'Unauthorized' });
            }
            else {
                // Correct token we send a new access token
                const accessToken = jwt.sign({
                    email: currentUserEmail,
                    userId: userId
                }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h'
                });
                return res.json({ accessToken });
            }
        })
    } else {
        return res.status(406).json({ message: 'Unauthorized' });
    }
}