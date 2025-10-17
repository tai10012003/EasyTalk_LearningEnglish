const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const config = require("../config/setting.json");
const { getGoogleAuthURL } = require("./../util/googleAuth");
const { getFacebookAuthURL } = require("../util/facebookAuth");
const verifyToken = require("./../util/VerifyToken");
const { UserService, UserprogressService } = require("../services");
const userService = new UserService();
const userprogressService = new UserprogressService();

router.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;
    const result = await userService.register(username, email, password, confirmPassword, role);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/api/login", async (req, res) => {
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
  try {
    const { token, role } = await userService.loginWithGoogle(code);
    const redirectUrl = `http://localhost:5173/login?token=${token}&role=${role}&provider=google`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.get("/auth/facebook", (req, res) => {
  res.redirect(getFacebookAuthURL());
});

router.get("/auth/facebook/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực từ Facebook");
  try {
    const { token, role } = await userService.loginWithFacebook(code);
    const redirectUrl = `http://localhost:5173/login?token=${token}&role=${role}&provider=facebook`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Facebook login error:", error);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  try {
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword, confirmNewPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile/data", verifyToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng !" });
    const userProgress = await userprogressService.getUserProgressByUserId(req.user.id);
    if (!userProgress)
      return res.status(404).json({ message: "User progress not found" });
    res.json({
      success: true,
      user,
      achievements: {
        unlockedGates: userProgress.unlockedGates.length,
        unlockedStages: userProgress.unlockedStages.length,
        experiencePoints: userProgress.experiencePoints,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile data", error });
  }
});

router.post("/profile/update", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const result = await userService.updateProfile(req.user.id, username, email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/api/user-list", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
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

router.post('/user/add', async (req, res) => {
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

router.get("/user/api/:id", async function (req, res) {
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

router.put('/user/update/:id', async (req, res) => {
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

router.post('/user/reset-temp-password/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    await userService.updatePassword(userId, hashedTempPassword);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.email.user, pass: config.email.pass },
    });
    const mailOptions = {
      from: config.email.user,
      to: user.email,
      subject: '🔑 Mật khẩu tạm thời mới từ EasyTalk',
      html: `
        <p>Xin chào <strong>${user.username}</strong>,</p>
        <p>Quản trị viên đã đặt lại mật khẩu tạm thời cho tài khoản của bạn.</p>
        <p>Vui lòng sử dụng mật khẩu tạm thời sau để đăng nhập và đổi lại mật khẩu mới:</p>
        <h3 style="color:#4CAF50;">${tempPassword}</h3>
        <p>Vì lý do bảo mật, bạn nên thay đổi mật khẩu ngay sau khi đăng nhập.</p>
        <br/>
        <p>Trân trọng,<br>Nhóm hỗ trợ EasyTalk</p>
      `,
    };
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Email send error:", error);
        return res.status(500).json({ message: "Gửi email thất bại!" });
      }
      res.json({
        success: true,
        message: "Đặt lại mật khẩu tạm thời thành công!",
        tempPassword,
      });
    });
  } catch (error) {
    console.error("Error resetting temp password:", error);
    res.status(500).json({ message: "Lỗi khi đặt lại mật khẩu tạm thời!" });
  }
});

router.delete("/user/delete/:id", async function (req, res) {
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