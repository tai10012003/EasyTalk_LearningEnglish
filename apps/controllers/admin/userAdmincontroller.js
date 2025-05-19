const express = require("express");
const router = express.Router();
const UserService = require("./../../services/userService");
const userService = new UserService();

router.get("/", async (req, res) => {
  try {
    const { users } = await userService.getUserList();
    res.render("users/user", { users });
  } catch (err) {
    res.status(500).send("Error fetching users: " + err.message);
  }
});

router.get("/add", (req, res) => {
  res.render("users/adduser");
});

router.get("/update/:id", async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("users/updateuser", { user });
  } catch (err) {
    res.status(500).send("Error fetching user: " + err.message);
  }
});

router.get("/api/user-list", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const { users, totalUsers } = await userService.getUserList(page, limit);
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

router.post('/api/add', async (req, res) => {
  try {
      const { username, email, password, role } = req.body;
      const newUser = {
          username,
          email,
          password,
          role,
          active: true,
          createdAt: new Date()
      };
      await userService.insertUser(newUser);
      res.status(201).json({ success: true, message: "Người dùng đã được thêm thành công !" });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error adding user", error: error.message });
  }
});

router.put('/api/update/:id', async (req, res) => {
  try {
      const { username, email, role, active } = req.body;
      if (!username || !email || !role || typeof active === 'undefined') {
          return res.status(400).json({ success: false, message: "Bắt buộc tất cả các trường." });
      }
      const updatedUser = {
          username,
          email,
          role,
          active: true
      };

      const result = await userService.updateUser({ _id: req.params.id, ...updatedUser });

      if (result.modifiedCount === 0) {
          return res.status(404).json({ success: false, message: "Không tìm thấy người dùng hoặc không có thay đổi nào được thực hiện." });
      }

      res.json({ success: true, message: "Thông tin người dùng đã được cập nhật thành công !" });
  } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, message: "Error updating user", error: error.message });
  }
});

router.delete("/api/delete/:id", async function (req, res) {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }

    res.json({ success: true, message: "Người dùng đã xóa thành công !" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
});

module.exports = router;