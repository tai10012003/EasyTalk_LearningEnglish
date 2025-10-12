const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const config = require("../../config/setting.json");
const UserService = require("./../../services/userService");
const userService = new UserService();

router.get("/api/user-list", async function (req, res) {
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