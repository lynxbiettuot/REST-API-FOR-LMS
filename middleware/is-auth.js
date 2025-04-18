const jwt = require('jsonwebtoken');
const { Instructor } = require('../config/roles');


//config to use .env variable
require('dotenv').config();

module.exports = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return res.status(401).json({ "message": "Not authenticated!" })
    }
    const [typeToken, accessToken] = authHeader.split(' ');
    let decodedToken;
    try {
        decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        return res.status(500).json({ "message": "Not authenticated!" });
    }
    if (!decodedToken) {
        return res.status(401).json({ "message": "Not authenticated!" });
    }
    const userRole = decodedToken.role;
    const userEmail = decodedToken.email;
    req.userRole = userRole;
    req.userEmail = userEmail;
    next();
}