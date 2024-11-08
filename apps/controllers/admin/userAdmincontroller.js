const express = require("express");
const router = express.Router();
const UserService = require("./../../services/userService");
const userService = new UserService();
// Hiển thị danh sách người dùng
router.get("/", async (req, res) => {
  try {
    const { users } = await userService.getUserList(); // Lấy danh sách người dùng từ UserService
    res.render("users/user", { users }); // Render template userlist.ejs và truyền dữ liệu users vào
  } catch (err) {
    res.status(500).send("Error fetching users: " + err.message);
  }
});

// Route để hiển thị trang thêm người dùng mới (GET)
router.get("/add", (req, res) => {
  res.render("users/adduser"); // Render trang thêm người dùng adduser.ejs
});

// Route để hiển thị trang cập nhật thông tin người dùng (GET)
router.get("/update/:id", async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id); // Lấy thông tin người dùng theo ID
    if (!user) {
      return res.status(404).send("User not found"); // Nếu không tìm thấy người dùng, trả về 404
    }
    res.render("users/updateuser", { user }); // Render trang updateuser.ejs và truyền dữ liệu user vào
  } catch (err) {
    res.status(500).send("Error fetching user: " + err.message); // Xử lý lỗi khi fetch thông tin người dùng
  }
});

// API để lấy danh sách người dùng (có phân trang)
router.get("/api/user-list", async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // Số lượng người dùng trên mỗi trang
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

// API để thêm người dùng mới
router.post('/api/add', async (req, res) => {
  try {
      const { username, email, password, role } = req.body;
      // Tạo một đối tượng user mới
      const newUser = {
          username,
          email,
          password, // Bạn có thể thêm bước mã hóa password nếu cần thiết
          role,
          active: true, // Mặc định người dùng mới sẽ active
          createdAt: new Date()
      };

      // Gọi service để thêm người dùng
      await userService.insertUser(newUser);

      res.status(201).json({ success: true, message: "User added successfully!" });
  } catch (error) {
      res.status(500).json({ success: false, message: "Error adding user", error: error.message });
  }
});

router.put('/api/update/:id', async (req, res) => {
  try {
      const { username, email, role, active } = req.body;

      // Ensure all fields are provided
      if (!username || !email || !role || typeof active === 'undefined') {
          return res.status(400).json({ success: false, message: "All fields are required." });
      }

      const updatedUser = {
          username,
          email,
          role,
          active
      };

      const result = await userService.updateUser({ _id: req.params.id, ...updatedUser });

      if (result.modifiedCount === 0) {
          return res.status(404).json({ success: false, message: "User not found or no changes made." });
      }

      res.json({ success: true, message: "User updated successfully!" });
  } catch (error) {
      console.error("Error updating user:", error); // Log the full error
      res.status(500).json({ success: false, message: "Error updating user", error: error.message });
  }
});



// API để xóa người dùng
router.delete("/api/delete/:id", async function (req, res) {
  try {
    const result = await userService.deleteUser(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting user", error: error.message });
  }
});


module.exports = router;