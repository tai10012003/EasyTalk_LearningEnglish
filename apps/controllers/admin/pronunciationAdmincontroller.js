var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var PronunciationService = require("./../../services/pronunciationService");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pronunciationService = new PronunciationService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, pronunciationService.imageFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const newName = pronunciationService.getNextImageFilename(ext);
    cb(null, newName);
  },
});

const upload = multer({ storage: storage });

router.get("/api/:id", async function (req, res) {
  try {
    const pronunciation = await pronunciationService.getPronunciation(req.params.id);
    if (!pronunciation) {
      return res.status(404).json({ message: "Pronunciation not found" });
    }
    res.json(pronunciation);
  } catch (err) {
    console.error("Error fetching pronunciation:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/pronunciation-list", async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 2;

  const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit);
  const totalPages = Math.ceil(totalPronunciations / limit);

  res.json({
    pronunciations,
    currentPage: page,
    totalPages,
  });
});

router.post("/api/add", upload.single("image"), async function (req, res) {
  try {
    let quizzes = [];
    if (req.body.quizzes) {
      try {
        quizzes = JSON.parse(req.body.quizzes);
      } catch (e) {
        console.error("Parse quizzes error:", e);
      }
    }
    const pronunciation = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      images: req.file ? `/static/images/pronunciation/${req.file.filename}` : null,
      quizzes: quizzes
    };
    const result = await pronunciationService.insertPronunciation(pronunciation);
    res.status(201).json({ message: "Bài học phát âm đã được thêm thành công !", result });
  } catch (error) {
    res.status(500).json({ message: "Error adding pronunciation", error });
  }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
  try {
    let quizzes = [];
    if (req.body.quizzes) {
      try {
        quizzes = JSON.parse(req.body.quizzes);
      } catch (e) {
        console.error("Parse quizzes error:", e);
      }
    }
    const existingPronunciation = await pronunciationService.getPronunciation(req.params.id);
    if (!existingPronunciation) {
      return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
    }
    let imagePath = existingPronunciation.images || "";
    if (req.file) {
      if (existingPronunciation.images) {
        const oldFilename = path.basename(existingPronunciation.images);
        const oldFilePath = path.join(pronunciationService.imageFolder, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        const ext = path.extname(req.file.originalname);
        const newFilePath = path.join(pronunciationService.imageFolder, oldFilename);
        fs.renameSync(req.file.path, newFilePath);
        imagePath = `/static/images/pronunciation/${oldFilename}`;
      } else {
        imagePath = `/static/images/pronunciation/${req.file.filename}`;
      }
    }
    const pronunciation = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      quizzes: quizzes,
      images: imagePath,
    };
    const result = await pronunciationService.updatePronunciation(req.params.id, pronunciation);
    res.json({ message: "Bài học phát âm đã được cập nhật thành công !", result });
  } catch (error) {
    console.error("Update pronunciation error:", error);
    res.status(500).json({ message: "Error updating pronunciation", error });
  }
});

router.delete("/api/pronunciation/:id", async function (req, res) {
  try {
    const pronunciation = await pronunciationService.getPronunciation(req.params.id);
    if (!pronunciation) {
      return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
    }
    if (pronunciation.images) {
      const filePath = path.join(pronunciationService.imageFolder, path.basename(pronunciation.images));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const result = await pronunciationService.deletePronunciation(req.params.id);
    if (result.deletedCount == 0) {
      return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
    }
    res.json({ message: "Bài học phát âm đã xóa thành công !" });
  } catch (error) {
    console.error("Delete pronunciation error:", error);
    res.status(500).json({ message: "Error deleting pronunciation", error: error.message });
  }
});

module.exports = router;