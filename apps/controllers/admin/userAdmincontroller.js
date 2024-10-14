const express = require("express");
const router = express.Router();
const User = require("../../models/user"); // Đảm bảo đường dẫn đúng

// Hiển thị danh sách người dùng
router.get("/", (req, res) => {
  User.find()
    .then((users) => {
      res.render("users/user", { users });
    })
    .catch((err) => res.status(500).send(err));
});
// Route để thêm người dùng mới
router.get("/add", (req, res) => {
    res.render("users/adduser");
  });
  
  router.post("/add", (req, res) => {
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      role: req.body.role,
    });
  
    newUser
      .save()
      .then(() => res.redirect("/users"))
      .catch((err) => res.status(400).send(err));
  });

  // Route để cập nhật người dùng
router.get("/update/:id", (req, res) => {
    User.findById(req.params.id)
      .then((user) => {
        res.render("users/updateuser", { user });
      })
      .catch((err) => res.status(404).send(err));
  });
  
  router.post("/update/:id", (req, res) => {
    const updateData = {
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
    };
  
    User.findByIdAndUpdate(req.params.id, updateData)
      .then(() => res.redirect("/users"))
      .catch((err) => res.status(400).send(err));
  });
  
  // Route để xóa người dùng
  router.post("/delete/:id", (req, res) => {
    User.findByIdAndDelete(req.params.id)
      .then(() => res.redirect("/users"))
      .catch((err) => res.status(400).send(err));
  });
  
  module.exports = router;