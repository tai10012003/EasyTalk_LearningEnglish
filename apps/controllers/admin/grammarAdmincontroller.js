const express = require("express");
const router = express.Router();
const Grammar = require("../../models/grammar");
var multer = require("multer");
var path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/grammar/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Tạo tên file duy nhất
    }
});
const upload = multer({ storage: storage });

// Route để hiển thị danh sách bài học ngữ pháp
router.get("/", (req, res) => {
    Grammar.find()
        .then(grammars => {
            res.render("grammars/grammar", { grammars });
        })
        .catch(err => res.status(500).send(err));
});

// Route để hiển thị trang thêm bài học ngữ pháp
router.get("/add", (req, res) => {
    res.render("grammars/addgrammar");
});

// Route để thêm bài học ngữ pháp mới
router.post("/add", upload.single('image'), (req, res) => {
    const newGrammar = new Grammar({
        title: req.body.title,
        description: req.body.description,
        content: req.body.content, // Lưu trực tiếp nội dung dài
        images: req.file ? [req.file.filename] : [] // Lưu tên file ảnh vào mảng
    });

    newGrammar.save()
        .then(() => res.redirect("/admin/grammar"))
        .catch(err => res.status(400).send(err));
});

// Route để hiển thị trang cập nhật bài học ngữ pháp
router.get("/update/:id", (req, res) => {
    Grammar.findById(req.params.id)
        .then(grammar => {
            res.render("grammars/updategrammar", { grammar });
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
    Grammar.findByIdAndUpdate(req.params.id, updateData)
        .then(() => res.redirect("/admin/grammar"))
        .catch(err => res.status(400).send(err));
});

// Route để xóa bài học ngữ pháp
router.post("/delete/:id", (req, res) => {
    Grammar.findByIdAndDelete(req.params.id)
        .then(() => res.redirect("/admin/grammar"))
        .catch(err => res.status(400).send(err));
});

module.exports = router;
