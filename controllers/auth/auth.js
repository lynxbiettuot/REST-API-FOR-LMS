const bcrypt = require('bcrypt');

//matkhau dat chung la 09012004

//Model
const Student = require('../../models/student.js');
const Instructor = require('../../models/instruction.js');
const Admin = require('../../models/admin.js');
const User = require('../../models/users.js');

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

        const existUser = await User.findOne({ email: email.trim() });

        if (existUser) {
            return res.status(400).json({ "message": "Account had already existed!", "statusCode": 400 });
        }

        if (password !== confrimPassword) {
            return res.status(400).json({ "message": "Confirm password is not valid", "statusCode": 400 });
        }
        //hashing
        const hashedPassword = await bcrypt.hash(password, 12);
        let dataReply = null;

        const newUser = new User({
            email: email,
            password: hashedPassword,
            role: role
        })

        await newUser.save();

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
    //find in Instructor model
    let currentUser = await User.findOne({ email: userEmail.trim() });
    if (!currentUser) {
        return res.status(404).json({ "message": "Account not found!", "statusCode": 404 });
    }
    let isEqual = await bcrypt.compare(userPassword, currentUser.password);
    if (isEqual) {
        const accessToken = jwt.sign(
            {
                email: currentUser.email,
                userId: currentUser.password.toString(),
                role: currentUser.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                email: currentUser.email,
                userId: currentUser.password.toString(),
                role: currentUser.role
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
        const role = currentUser.role;
        let userData;
        if (role === "Instructor") {
            userData = await Instructor.findOne({ email: currentUser.email.trim() });
        } else if (role === "Student") {
            userData = await Student.findOne({ email: currentUser.email.trim() });
        } else if (role === "Admin") {
            userData = await Admin.findOne({ email: currentUser.email.trim() });
        }
        return res.status(200).json({ "message": "success", "statusCode": 200, "accessToken": accessToken, "refreshToken": refreshToken, "userData": userData, "role": currentUser.role });
    }
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