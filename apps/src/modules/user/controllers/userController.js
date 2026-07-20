const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { verifyToken, verifyAdmin, optionalAuth } = require("../../../shared/middleware/verifyToken");
const cache = require('../../../shared/utils/cacheService');
const { getGoogleAuthURL } = require("../../../shared/utils/googleAuth");
const { getFacebookAuthURL } = require("../../../shared/utils/facebookAuth");
const UserService = require("../services/userService");
const { validateRegisterInput, validateLoginInput, validateChangePasswordInput, validateUserInput } = require("../validators/userValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");
const { getRefreshTokenFromRequest, setRefreshTokenCookie, clearRefreshTokenCookie } = require("../utils/refreshTokenCookie");
const { createRateLimiter, getClientIp } = require("../../../shared/middleware/rateLimiter");

const userService = new UserService();
let notificationService = null;
let userSettingService = null;
let userProgressService = null;
let flashcardService = null;

function setNotificationService(service) {
    notificationService = service;
    userService.notificationService = service;
}

function setUserSettingService(service) {
    userSettingService = service;
    userService.userSettingService = service;
}

function setUserProgressService(service) {
    userProgressService = service;
    userService.userProgressService = service;
}

function setFlashcardService(service) {
    flashcardService = service;
    userService.flashcardService = service;
}

function getAllowedClientOrigins() {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return clientUrl
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean)
        .map(origin => {
            try {
                return new URL(origin).origin;
            } catch {
                return origin;
            }
        });
}

function validateRefreshRequestOrigin(req, res, next) {
    const requestOrigin = req.headers.origin;
    const requestReferer = req.headers.referer;
    const candidate = requestOrigin || requestReferer;
    if(!candidate) {
        if(process.env.NODE_ENV === "production") {
            return res.status(403).json({
                success: false,
                message: "Refresh request origin is required.",
                code: "CSRF_ORIGIN_REQUIRED"
            });
        }
        return next();
    }
    let normalizedOrigin;
    try {
        normalizedOrigin = new URL(candidate).origin;
    } catch {
        return res.status(403).json({
            success: false,
            message: "Refresh request origin is invalid.",
            code: "CSRF_ORIGIN_INVALID"
        });
    }
    if(!getAllowedClientOrigins().includes(normalizedOrigin)) {
        return res.status(403).json({
            success: false,
            message: "Refresh request origin is not allowed.",
            code: "CSRF_ORIGIN_FORBIDDEN"
        });
    }
    next();
}

const loginRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    keyPrefix: "login",
    keyGenerator: (req) => {
        const email = String(req.body?.email || "unknown").trim().toLowerCase();
        return `${getClientIp(req)}:${email}`;
    },
    message: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau."
});

const refreshTokenRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: "refresh-token",
    keyGenerator: (req) => getClientIp(req),
    message: "Refresh token quá nhiều lần. Vui lòng thử lại sau."
});

router.post("/register/send-code", asyncHandler(async (req, res) => {
    try {
        const validation = validateRegisterInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { username, email, password } = req.body;
        const result = await userService.sendRegisterCode(username, email, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));

router.post("/register/verify-code", asyncHandler(async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await userService.verifyRegisterCode(email, code);
        await notificationService.createNotification(
            user._id,
            "Chào mừng bạn đến với EasyTalk!",
            "Bạn đã đăng ký tài khoản mới thành công. Hãy bắt đầu học ngay hôm nay nhé!",
            "success"
        );
        res.status(201).json({ success: true, message: "Đăng ký tài khoản thành công!", user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));

router.post("/login", loginRateLimiter, asyncHandler(async (req, res) => {
    try {
        const validation = validateLoginInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { email, password } = req.body;
        const result = await userService.login(email, password, req);
        setRefreshTokenCookie(res, result.refreshToken);
        delete result.refreshToken;
        res.json(result);
    } catch (error) {
        await userService.securityAuditService.log("login_failed", {
            email: req.body?.email || "",
            status: "failed",
            reason: error.message,
            req
        });
        res.status(403).json({ message: error.message });
    }
}));

router.get("/auth/google", (req, res) => {
    res.redirect(getGoogleAuthURL());
});

router.get("/auth/google/callback", asyncHandler(async (req, res) => {
    const code = req.query.code;
    if(!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực");
    const redirectBase = process.env.CLIENT_URL || "http://localhost:5173";
    try {
        const { refreshToken } = await userService.loginWithGoogle(code, req);
        setRefreshTokenCookie(res, refreshToken);
        const redirectUrl = `${redirectBase}/login?socialLogin=success&provider=google`;
        res.redirect(redirectUrl);
    } catch (error) {
        res.redirect(`${redirectBase}/login?error=${encodeURIComponent(error.message)}`);
    }
}));

router.get("/auth/facebook", (req, res) => {
    res.redirect(getFacebookAuthURL());
});

router.get("/auth/facebook/callback", asyncHandler(async (req, res) => {
    const code = req.query.code;
    if(!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực từ Facebook");
    const redirectBase = process.env.CLIENT_URL || "http://localhost:5173";
    try {
        const { refreshToken } = await userService.loginWithFacebook(code, req);
        setRefreshTokenCookie(res, refreshToken);
        const redirectUrl = `${redirectBase}/login?socialLogin=success&provider=facebook`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("Facebook login error:", error);
        res.redirect(`${redirectBase}/login?error=${encodeURIComponent(error.message)}`);
    }
}));

router.post("/refresh-token", refreshTokenRateLimiter, validateRefreshRequestOrigin, asyncHandler(async (req, res) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        const result = await userService.refreshAccessToken(refreshToken, req);
        setRefreshTokenCookie(res, result.refreshToken);
        delete result.refreshToken;
        res.json(result);
    } catch (error) {
        if(error.code !== "REFRESH_TOKEN_REUSED") {
            clearRefreshTokenCookie(res);
        }
        res.status(401).json({ message: error.message, code: error.code });
    }
}));

router.get("/sessions", verifyToken, asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    const sessions = await userService.listSessions(req.user.id, refreshToken);
    res.json({ success: true, sessions });
}));

router.delete("/sessions/:sessionId", verifyToken, asyncHandler(async (req, res) => {
    const currentSession = await userService.authService.getSessionFromRefreshToken(getRefreshTokenFromRequest(req));
    const result = await userService.revokeSession(req.user.id, req.params.sessionId, req);
    if(result.modifiedCount == 0) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy phiên đăng nhập hoặc phiên đã bị thu hồi."
        });
    }
    if(currentSession?.sessionId === req.params.sessionId) {
        clearRefreshTokenCookie(res);
    }
    res.json({
        success: true,
        message: "Đã đăng xuất thiết bị thành công.",
        currentRevoked: currentSession?.sessionId === req.params.sessionId
    });
}));

router.delete("/sessions", verifyToken, asyncHandler(async (req, res) => {
    const result = await userService.revokeAllSessions(req.user.id, req);
    clearRefreshTokenCookie(res);
    res.json({
        success: true,
        message: "Đã đăng xuất tất cả thiết bị.",
        revokedCount: result.modifiedCount || 0
    });
}));

router.post("/logout", optionalAuth, asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromRequest(req);
    const result = await userService.logout(refreshToken, req);
    clearRefreshTokenCookie(res);
    const userId = req.user?.id;
    if (userId) {
        await cache.invalidatePatterns([`cache:${userId}:*`], `User ${userId}`);
    }
    res.json(result);
}));

router.post("/change-password", verifyToken, asyncHandler(async (req, res) => {
    try {
        const validation = validateChangePasswordInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const result = await userService.changePassword(req.user.id, currentPassword, newPassword, confirmNewPassword, req);
        clearRefreshTokenCookie(res);
        await notificationService.createNotification(
            req.user.id,
            "Đổi mật khẩu thành công",
            "Bạn đã đổi mật khẩu thành công. Hãy ghi nhớ mật khẩu mới nhé!",
            "success"
        );
        res.json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));

router.post("/forgot-password", asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const result = await userService.sendForgotPasswordCode(email);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}));

router.post("/verify-code", (req, res) => {
    try {
        const { email, code } = req.body;
        const result = userService.verifyForgotPasswordCode(email, code);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post("/reset-password", asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    const result = await userService.resetPassword(email, newPassword);
    const user = await userService.getUserByEmail(email);
    if(user) {
        await notificationService.createNotification(
            user._id,
            "Lấy lại mật khẩu thành công",
            "Bạn đã lấy lại mật khẩu thành công. Hãy ghi nhớ mật khẩu mới nhé!",
            "success"
        );
    }
    res.json(result);
}));

router.get("/profile/data", verifyToken, asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    if(!user) return res.status(404).json({ message: "Không tìm thấy người dùng !" });
    res.json({ success: true, user });
}));

router.put("/profile/update", verifyToken, asyncHandler(async (req, res) => {
    const { username, email } = req.body;
    const result = await userService.updateProfile(req.user.id, username, email);
    res.json(result);
}));

router.get("/api/user-list", verifyAdmin, asyncHandler(async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const role = req.query.role;
    const { users, totalUsers } = await userService.getUserList(page, limit, role);
    const totalPages = Math.ceil(totalUsers / limit);
    res.json({success: true,data: users,currentPage: page,totalPages});
}));

router.post('/add', verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateUserInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    const { username, email, password, role, active } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        username,
        email,
        password: hashedPassword,
        role,
        active,
        createdAt: new Date()
    };
    await userService.insertUser(newUser);
    res.status(201).json({ success: true, message: "Người dùng đã được thêm thành công !" });
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
    const id = req.params.id;
    const user = await userService.getUser(id);
    if(!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
}));

router.put('/update/:id', verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateUserInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    const { username, email, role, active } = req.body;
    const updatedUser = { username, email, role, active };
    const result = await userService.updateUser({ _id: req.params.id, ...updatedUser }, req.user.id, req);
    if(!result) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng hoặc không có thay đổi nào được thực hiện." });
    }
    res.json({ success: true, message: "Thông tin người dùng đã được cập nhật thành công !" });
}));

router.post('/reset-temp-password/:userId', verifyAdmin, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const result = await userService.resetTempPassword(userId, req.user.id, req);
    res.json(result);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async function (req, res) {
    const result = await userService.deleteUser(req.params.id);
    if(result.deletedCount == 0) {
        return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }
    res.json({ success: true, message: "Người dùng đã xóa thành công !" });
}));

module.exports = router;
module.exports.setNotificationService = setNotificationService;
module.exports.setUserSettingService = setUserSettingService;
module.exports.setUserProgressService = setUserProgressService;
module.exports.setFlashcardService = setFlashcardService;