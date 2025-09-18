const jsonwebtoken = require("jsonwebtoken");
const config = require("./../config/setting.json");

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token không tồn tại. Người dùng cần đăng nhập." });
    }

    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Failed to authenticate token:", err.message);
        return res.status(403).json({ message: 'Failed to authenticate token.' });
    }
}

module.exports = verifyToken;