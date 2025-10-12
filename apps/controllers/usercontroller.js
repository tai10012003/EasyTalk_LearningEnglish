const express = require("express");
const router = express.Router();
const UserService = require("../services/userService");
const UserProgressService = require("../services/userprogressService")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const { getGoogleAuthURL, getGoogleUser } = require('./../util/googleAuth');
const verifyToken = require("./../util/VerifyToken")
const config = require("../config/setting.json");
const userService = new UserService();
const userProgressService = new UserProgressService();
let verificationCodes = {};

router.get("/register", (req, res) => {
  res.render("users/signup");
});

router.get("/login", (req, res) => {
  res.render("users/login");
});

router.post("/api/register", async (req, res) => {
  const { username, email, password, confirmPassword, role = "user" } = req.body;

  if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
  }
  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { username, email, password: hashedPassword, role, active: "active" };
      await userService.insertUser(user);
      res.status(201).json({ message: "Đăng ký thành công !!" });
  } catch (error) {
      res.status(500).json({ message: "Đăng ký thất bại !!", error });
  }
});

router.post("/api/login", async (req, res) => {
  try {
      const user = await userService.getUserByEmail(req.body.email);
      if (!user) 
        return res.status(403).json({ message: "Email đăng nhập hoặc mật khẩu không đúng !!" });

      const passwordIsValid = await bcrypt.compare(req.body.password, user.password);
      if (!passwordIsValid) 
        return res.status(403).json({ message: "Email đăng nhập hoặc mật khẩu không đúng !!" });
      if (user.active == "locked") {
        return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để hỗ trợ !!" });
      }
      const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, config.jwt.secret, { expiresIn: '1h' });
      res.status(200).json({ token, role: user.role });
  } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

router.get('/auth/google', (req, res) => {
  res.redirect(getGoogleAuthURL());
});

router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Lỗi: Không nhận được mã xác thực');
  try {
    const googleUser = await getGoogleUser(code);
    const { email, name } = googleUser;
    let user = await userService.getUserByEmail(email);
    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      user = await userService.insertUser({
        username: name || email.split('@')[0],
        password: hashedPassword,
        email,
        role: "user",
        active: "active",
      });
      user = await userService.getUserByEmail(email);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.email.user, pass: config.email.pass },
      });
      const mailOptions = {
        from: config.email.user,
        to: email,
        subject: '🔑 Mật khẩu tạm thời từ EasyTalk',
        html: `
          <p>Xin chào <strong>${name || email.split('@')[0]}</strong>,</p>
          <p>Bạn vừa đăng ký tài khoản bằng Google trên EasyTalk.</p>
          <p>Đây là mật khẩu tạm thời để bạn có thể đăng nhập bằng tài khoản email nếu muốn:</p>
          <h3 style="color:#4CAF50;">${tempPassword}</h3>
          <p>Vì lý do bảo mật, bạn nên đổi mật khẩu sau khi đăng nhập.</p>
          <br/>
          <p>Trân trọng,<br>Nhóm hỗ trợ EasyTalk</p>
        `,
      };
      transporter.sendMail(mailOptions, (error) => {
        if (error) console.error("Gửi email thất bại:", error);
        else console.log(`✅ Đã gửi mật khẩu tạm thời đến ${email}`);
      });
    }
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: '1h' });
    const redirectUrl = `http://localhost:5173/login?token=${token}&role=${user.role}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google login error:', error);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.get("/change-password", (req, res) => {
  res.render("users/changepassword");
});

router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin mật khẩu." });
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "Mật khẩu mới không khớp." });
  }
  try {
    const userId = req.user.id;
    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    const passwordIsValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordIsValid) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác." });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userService.updatePassword(userId, hashedNewPassword);
    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Có lỗi xảy ra khi đổi mật khẩu." });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: "Email đã nhập không tồn tại trên hệ thống !!" });
  }

  const verificationCode = Math.floor(10000 + Math.random() * 90000);
  verificationCodes[email] = verificationCode;
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.email.user, pass: config.email.pass }
  });

  const mailOptions = {
    from: config.email.user,
    to: email,
    subject: 'Thông Báo Mã Xác Thực Đặt Lại Mật Khẩu Từ EasyTalk',
    
    html: `<p>Xin chào,</p>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Vui lòng sử dụng mã xác minh bên dưới để tiến hành đặt lại mật khẩu của bạn. Mã này có hiệu lực trong <strong>1 phút</strong>.</p>
      <h2 style="color: #4CAF50;">${verificationCode}</h2>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc <a href="pductai14@gmail.com">liên hệ với bộ phận hỗ trợ</a> nếu bạn có bất kỳ thắc mắc nào.</p>
      <p>Trân trọng,</p>
      <p>Nhóm hỗ trợ EasyTalk</p>`
    };
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return res.status(500).json({ message: 'Failed to send email' });
      }
      res.json({ message: 'Verification code sent' });
  });
});

router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] && verificationCodes[email] == code) {
      delete verificationCodes[email];
      res.json({ message: 'Mã xác thực chính xác!' });
  } else {
      res.status(400).json({ message: 'Mã xác thực không hợp lệ. Vui lòng nhập chính xác!' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.updatePassword(user._id, hashedPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

router.get("/profile", (req, res) => {
  res.render("users/profile", { user: req.user });
});

router.get("/profile/data", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUser(userId);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng !" });
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    if (!userProgress) {
      return res.status(404).json({ message: "User progress not found" });
    }

    res.json({
      success: true,
      user,
      achievements: {
        unlockedGates: userProgress.unlockedGates.length,
        unlockedStages: userProgress.unlockedStages.length,
        experiencePoints: userProgress.experiencePoints,
      }
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    res.status(500).json({ message: "Error fetching profile data", error });
  }
});


router.post("/profile/update", verifyToken, async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.id;

  try {
    const updatedUser = await userService.updateUser({ _id: userId, username, email });
    if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy người dùng !" });

    res.json({ success: true, message: "Thông tin của bạn đã được cập nhật thành công !", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error });
  }
});

module.exports = router;
