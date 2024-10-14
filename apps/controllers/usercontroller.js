const express = require("express");
const router = express.Router();
const User = require("../models/user"); // Đảm bảo đường dẫn đúng
const passport = require("passport"); 
const bcrypt = require('bcrypt');

//trang dang ki
router.get("/register", (req, res) => {
  res.render("users/signup"); // Assuming the signup.ejs is inside the 'views/users/' folder
});
router.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate that passwords match
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match.");
  }

  try {
    // Băm mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      username,
      email,
      password: hashedPassword, // Lưu mật khẩu đã băm
    });

    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/login", (req, res) => {
  res.render("users/login");
});

router.post("/login", passport.authenticate("local", {
  failureRedirect: "/login",  // Nếu đăng nhập thất bại
  failureFlash: true          // Passport sẽ tự động sử dụng req.flash để gửi thông báo lỗi
}), function(req, res) {
  // Kiểm tra nếu req.user tồn tại
  if (!req.user) {
    req.flash('error', 'User not found');
    return res.redirect('/login');
  }

  // Kiểm tra trạng thái active
  if (req.user.active === "locked") {
    req.flash('error', 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên !!');
    return res.redirect('/login');
  }

  // Nếu đăng nhập thành công
  req.flash('success', 'Login successful!');

  // Điều hướng sau khi đăng nhập thành công dựa trên role
  if (req.user.role === "admin") {
    res.redirect("/admin");  // Điều hướng đến trang admin nếu user là admin
  } else {
    res.redirect("/");  // Điều hướng đến trang home nếu user không phải admin
  }
});


router.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'You have logged out successfully!'); // Thêm thông báo đăng xuất thành công
    res.redirect("/login");  // Điều hướng về trang đăng nhập sau khi đăng xuất
  });
});
router.get("/profile", (req, res) => {
  res.render("users/profile", { user: req.user });
});

// Định nghĩa route để cập nhật thông tin người dùng
router.post('/profile/update', async (req, res) => {
  try {
      // Lấy user ID từ session (đảm bảo user đã đăng nhập)
      const userId = req.user._id;
      const { username, email } = req.body;

      // Tìm và cập nhật thông tin user
      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { username, email }, 
          { new: true } // Trả về user đã được cập nhật
      );

      if (updatedUser) {
          return res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
      } else {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
  } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while updating profile' });
  }
});



module.exports = router;
