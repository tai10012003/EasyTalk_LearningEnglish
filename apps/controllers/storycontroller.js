const express = require("express");
const router = express.Router();
const Story = require("../models/story");

// Route để hiển thị trang chính với danh sách các câu chuyện
router.get("/", (req, res) => {
  Story.find()
    .then((stories) => {
      res.render("/stories/story_list", { stories }); // Render trang EJS và truyền dữ liệu stories
    })
    .catch((err) => res.status(500).send(err));
});

// Route để tạo mới một câu chuyện
// router.post("/", (req, res) => {
//   const { title, content, audio, genre, vietnameseScript } = req.body;

//   const newStory = new Story({
//     title,
//     content,
//     audio,
//     genre,
//     vietnameseScript,
//   });

//   newStory
//     .save()
//     .then(() => {
//       res.redirect("admin/stories"); // Sau khi tạo thành công, chuyển về trang danh sách
//     })
//     .catch((err) => res.status(500).send(err));
// });

// Route để xóa một câu chuyện
// router.delete("/:id", (req, res) => {
//   Story.findByIdAndDelete(req.params.id)
//     .then(() => {
//       res.redirect("admin/stories"); // Sau khi xóa, quay lại trang danh sách
//     })
//     .catch((err) => res.status(500).send(err));
// });

// Route để lấy dữ liệu của một câu chuyện để chỉnh sửa (bạn có thể thêm phần sửa tại đây)
// router.get("/edit/:id", (req, res) => {
//   Story.findById(req.params.id)
//     .then((story) => {
//       res.render("admin/story_edit", { story }); // Render trang chỉnh sửa
//     })
//     .catch((err) => res.status(500).send(err));
// });

// Route để cập nhật một câu chuyện (cần thêm phần chỉnh sửa .ejs để xử lý)
// router.put("/:id", (req, res) => {
//   Story.findByIdAndUpdate(req.params.id, req.body, { new: true })
//     .then(() => {
//       res.redirect("/stories"); // Sau khi cập nhật, chuyển về trang danh sách
//     })
//     .catch((err) => res.status(500).send(err));
// });

module.exports = router;
