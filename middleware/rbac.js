const roles = require('../config/roles.js');

const authorize = (requiredPermisssions) => {
    return (req, res, next) => {
        const userRole = req.userRole;
        console.log(userRole);
        if (!roles[userRole] || !requiredPermisssions.every(perm => roles[userRole].includes(perm))) {
            return res.status(403).json({ "message": "Not authorized!", "statusCode": 403 });
        }
        next();
    }
}

module.exports = authorize;