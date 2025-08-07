const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authorization = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
}

module.exports = authorization;