const bcrypt = require('bcrypt');
//random number
const crypto = require('crypto');
//send mail
const nodemailer = require('nodemailer');

//create transporter for sending email
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: "hoangvlinh09012004@gmail.com",
        pass: "petd tgkw ekmc skpf",
    },
});

//function to send mail
async function sendOtpNotification(userEmail, user) {
    const mailOptions = {
        from: "hoangvlinh09012004@gmail.com",
        to: userEmail,
        subject: "OTP to reset password",
        text: `Your OTP password is ${user.resetOtp}.
        Do not share your OTP with anyone else.Validation code will expire in 5 minutes`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email send to:', userEmail);
    } catch (err) {
        console.log(err);
    }
}

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

        //add a field which name userId to refer to User model
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
    console.log(userEmail);
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

//send OTP via email
exports.handleSendOtp = async (req, res, next) => {
    try {
        const email = req.body.email;

        const otp = crypto.randomInt(1000, 9999);
        const currentUser = await User.findOne({ email: email });
        if (!currentUser) {
            return res.status(404).json({ "message": "Account is not exist!" });
        }
        currentUser.resetOtp = otp;
        //expire after 5 minutes
        currentUser.otpExpiry = Date.now() + 5 * 60 * 1000
        await currentUser.save();

        //send OTP
        sendOtpNotification(email, currentUser);

        //send notification to user
        return res.json({ "message": "OTP has sent to your email!", "email": email });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ "message": "Internal server error!" })
    }
}

//verify OTP and handle reset password
exports.handleVerifyOtpAndResetPassword = async (req, res, next) => {
    try {
        const email = req.body.email;
        const otpVerify = req.body.otpVerify;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmNewPassword;

        const currentUser = await User.findOne({ email: email });
        if (!currentUser) {
            return res.status(404).json({ "message": "Account is not exist!" });
        }

        //check if OTP is expired!
        if (Date.now() > currentUser.otpExpiry) {
            return res.status(401).json({ "message": "OTP is expired!" });
        }

        //check if OTP is not valid
        if (currentUser.resetOtp !== otpVerify) {
            return res.status(401).json({ "message": "OTP is not valid!" });
        }

        //check if new password and confirm password is not valid
        if (confirmNewPassword !== newPassword) {
            return res.status(401).json({ "message": "Password did not match!" });
        }

        const currentRole = currentUser.role;
        let dataUser;
        if (currentRole === "Instructor") {
            dataUser = await Instructor.findOne({ email: email });
        } else if (currentRole === "Student") {
            dataUser = await Student.findOne({ email: email });
        }
        console.log(dataUser);
        //update information if pass
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        dataUser.password = hashedPassword;

        currentUser.password = hashedPassword;
        currentUser.resetOtp = undefined;
        currentUser.otpExpiry = undefined;

        await dataUser.save();
        await currentUser.save();
        return res.status(200).json({ "message": "Password is changed!" });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ "message": "Internal server error!" });
    }
}
