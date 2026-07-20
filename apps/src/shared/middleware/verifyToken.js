const jsonwebtoken = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const config = require("./../config/setting");
const DatabaseConnection = require("../database/database");

const client = DatabaseConnection.getMongoClient();
const db = client.db(config.mongodb.database);
const usersCollection = db.collection("users");
const JWT_ALGORITHM = "HS256";

function normalizeTokenVersion(tokenVersion) {
    return Number(tokenVersion || 0);
}

async function findAuthenticatedUser(decoded) {
    const userId = decoded.id || decoded.userId || decoded.sub;
    if(!userId || !ObjectId.isValid(userId)) {
        return null;
    }
    return await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        {
            projection: {
                username: 1,
                email: 1,
                role: 1,
                active: 1,
                tokenVersion: 1
            }
        }
    );
}

async function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: "Token không tồn tại. Người dùng cần đăng nhập.",
            code: "NO_TOKEN"
        });
    }
    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
        if (decoded.type == "refresh") {
            return res.status(403).json({
                message: "Invalid token type. Use access token instead.",
                code: "INVALID_TOKEN_TYPE"
            });
        }
        const user = await findAuthenticatedUser(decoded);
        if(!user) {
            return res.status(401).json({
                message: "Người dùng không tồn tại hoặc token không hợp lệ.",
                code: "USER_NOT_FOUND"
            });
        }
        if(user.active === "locked") {
            return res.status(403).json({
                message: "Tài khoản đã bị khóa.",
                code: "ACCOUNT_LOCKED"
            });
        }
        if(normalizeTokenVersion(decoded.tokenVersion) !== normalizeTokenVersion(user.tokenVersion)) {
            return res.status(401).json({
                message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.",
                code: "TOKEN_REVOKED"
            });
        }
        req.user = {
            ...decoded,
            id: user._id.toString(),
            role: user.role,
            username: user.username,
            email: user.email,
            tokenVersion: user.tokenVersion || 0
        };
        req.authUser = user;
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
    return verifyToken(req, res, () => {
        if (req.authUser?.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền thực hiện hành động này.",
                code: "FORBIDDEN"
            });
        }
        next();
    });
}

async function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
        if (decoded.type !== "refresh") {
            const user = await findAuthenticatedUser(decoded);
            const validUser = user
                && user.active !== "locked"
                && normalizeTokenVersion(decoded.tokenVersion) === normalizeTokenVersion(user.tokenVersion);
            if(validUser) {
                req.user = {
                    ...decoded,
                    id: user._id.toString(),
                    role: user.role,
                    username: user.username,
                    email: user.email,
                    tokenVersion: user.tokenVersion || 0
                };
                req.authUser = user;
            } else {
                req.user = null;
            }
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