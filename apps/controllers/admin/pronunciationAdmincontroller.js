const express = require("express");
const router = express.Router();
const Pronunciation = require("../../models/pronunciation");
var multer = require("multer");
var path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/pronunciation/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file duy nhất
    }
});
const upload = multer({ storage: storage });

// Route để hiển thị danh sách bài học phát âm
router.get("/", (req, res) => {
    Pronunciation.find()
        .then(pronunciations => {
            res.render("pronunciations/pronunciation", { pronunciations });
        })
        .catch(err => res.status(500).send(err));
});

// Route để hiển thị trang thêm bài học phát âm
router.get("/add", (req, res) => {
    res.render("pronunciations/addpronunciation");
});

// Route để thêm bài học phát âm mới
router.post("/add", upload.single('image'), (req, res) => {
    const newPronunciation = new Pronunciation({
        title: req.body.title,
        description: req.body.description,
        content: req.body.content, // Lưu trực tiếp nội dung dài
        images: req.file ? [req.file.filename] : [] // Lưu tên file ảnh vào mảng
    });

    newPronunciation.save()
        .then(() => res.redirect("/admin/pronunciation"))
        .catch(err => res.status(400).send(err));
});

// Route để hiển thị trang cập nhật bài học phát âm
router.get("/update/:id", (req, res) => {
    Pronunciation.findById(req.params.id)
        .then(pronunciation => {
            res.render("pronunciations/updatepronunciation", { pronunciation });
        })
        .catch(err => res.status(404).send(err));
});

// Route để cập nhật bài học ngữ pháp
router.post("/update/:id", upload.single('image'), (req, res) => {
    const updateData = {
        title: req.body.title,
        description: req.body.description,
        content: req.body.content, // Lưu trực tiếp nội dung dài
    };
    if (req.file) {
        updateData.images = [req.file.filename];
    }
    Pronunciation.findByIdAndUpdate(req.params.id, updateData)
        .then(() => res.redirect("/admin/pronunciation"))
        .catch(err => res.status(400).send(err));
});

// Route để xóa bài học ngữ pháp
router.post("/delete/:id", (req, res) => {
    Pronunciation.findByIdAndDelete(req.params.id)
        .then(() => res.redirect("/admin/pronunciation"))
        .catch(err => res.status(400).send(err));
});

module.exports = router;
