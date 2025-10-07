const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
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