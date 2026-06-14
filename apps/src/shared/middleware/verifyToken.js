const jsonwebtoken = require("jsonwebtoken");
const config = require("./../config/setting");

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: "Token không tồn tại. Người dùng cần đăng nhập.",
            code: "NO_TOKEN"
        });
    }
    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret);
        if (decoded.type == "refresh") {
            return res.status(403).json({
                message: "Invalid token type. Use access token instead.",
                code: "INVALID_TOKEN_TYPE"
            });
        }
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Failed to authenticate token:", err.message);
        if (err.name == "TokenExpiredError") {
            return res.status(401).json({
                message: "Token đã hết hạn. Vui lòng làm mới token.",
                code: "TOKEN_EXPIRED",
                expiredAt: err.expiredAt
            });
        }
        if (err.name == "JsonWebTokenError") {
            return res.status(403).json({
                message: "Token không hợp lệ.",
                code: "INVALID_TOKEN"
            });
        }
        return res.status(403).json({
            message: "Xác thực token thất bại.",
            code: "AUTH_FAILED",
            error: err.message
        });
    }
}

function verifyAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện hành động này.",
                code: "FORBIDDEN"
            });
        }
        next();
    });
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret);
        if (decoded.type !== "refresh") {
            req.user = decoded;
        } else {
            req.user = null;
        }
    } catch (err) {
        req.user = null;
    }
    next();
}

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
module.exports.optionalAuth = optionalAuth;