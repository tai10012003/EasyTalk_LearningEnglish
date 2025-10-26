const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const config = require("../config/setting");
const { getGoogleAuthURL } = require("./../util/googleAuth");
const { getFacebookAuthURL } = require("../util/facebookAuth");
const verifyToken = require("./../util/VerifyToken");
const { UserService, NotificationService, UserprogressService } = require("../services");
const userService = new UserService();
const notificationService = new NotificationService();
const userprogressService = new UserprogressService();

router.post("/register/send-code", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await userService.sendRegisterCode(username, email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/register/verify-code", async (req, res) => {
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
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
});

router.get("/auth/google", (req, res) => {
  res.redirect(getGoogleAuthURL());
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực");
  const redirectBase = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const { token, refreshToken, role } = await userService.loginWithGoogle(code);
    const redirectUrl = `${redirectBase}/login?token=${token}&refreshToken=${refreshToken}&role=${role}&provider=google`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`${redirectBase}/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.get("/auth/facebook", (req, res) => {
  res.redirect(getFacebookAuthURL());
});

router.get("/auth/facebook/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực từ Facebook");
  const redirectBase = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const { token, refreshToken, role } = await userService.loginWithFacebook(code);
    const redirectUrl = `${redirectBase}/login?token=${token}&refreshToken=${refreshToken}&role=${role}&provider=facebook`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Facebook login error:", error);
    res.redirect(`${redirectBase}/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await userService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await userService.logout(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  try {
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword, confirmNewPassword);
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
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await userService.sendForgotPasswordCode(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/verify-code", (req, res) => {
  try {
    const { email, code } = req.body;
    const result = userService.verifyForgotPasswordCode(email, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const result = await userService.resetPassword(email, newPassword);
    const user = await userService.getUserByEmail(email);
    if (user) {
      await notificationService.createNotification(
        user._id,
        "Lấy lại mật khẩu thành công",
        "Bạn đã lấy lại mật khẩu thành công. Hãy ghi nhớ mật khẩu mới nhé!",
        "success"
      );
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile/data", verifyToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng !" });
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile data", error });
  }
});

router.put("/profile/update", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const result = await userService.updateProfile(req.user.id, username, email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/user-list", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const role = req.query.role;
    const { users, totalUsers } = await userService.getUserList(page, limit, role);
    const totalPages = Math.ceil(totalUsers / limit);
    res.json({
      success: true,
      data: users,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding user", error: error.message });
  }
});

router.get("/api/:id", async function (req, res) {
  try {
    const id = req.params.id;
    const user = await userService.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Error fetching user: " + err.message);
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const { username, email, role, active } = req.body;
    const updatedUser = {
      username,
      email,
      role,
      active
    };
    const result = await userService.updateUser({ _id: req.params.id, ...updatedUser });
    if (result.modifiedCount == 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng hoặc không có thay đổi nào được thực hiện." });
    }
    res.json({ success: true, message: "Thông tin người dùng đã được cập nhật thành công !" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Error updating user", error: error.message });
  }
});

router.post('/reset-temp-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await userService.resetTempPassword(userId);
    res.json(result);
  } catch (error) {
    console.error("Error resetting temp password:", error);
    res.status(500).json({ message: error.message || "Lỗi khi đặt lại mật khẩu tạm thời!" });
  }
});

router.delete("/delete/:id", async function (req, res) {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (result.deletedCount == 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }
    res.json({ success: true, message: "Người dùng đã xóa thành công !" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
});

module.exports = router;