var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var GrammarService = require("./../../services/grammarService");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const grammarService = new GrammarService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, grammarService.imageFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const newName = grammarService.getNextImageFilename(ext);
    cb(null, newName);
  },
});

const upload = multer({ storage: storage });

router.get("/api/:id", async function (req, res) {
  try {
    const grammar = await grammarService.getGrammar(req.params.id);
    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }
    res.json(grammar);
  } catch (err) {
    console.error("Error fetching grammar:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/grammar-list", async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 2;

  const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit);
  const totalPages = Math.ceil(totalGrammars / limit);

  res.json({
    grammars,
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
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      images: req.file ? `/static/images/grammar/${req.file.filename}` : null,
      quizzes: quizzes
    };
    const result = await grammarService.insertGrammar(grammar);
    res.status(201).json({ message: "Bài học ngữ pháp đã được thêm thành công !", result });
  } catch (error) {
    res.status(500).json({ message: "Error adding grammar", error });
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
    const existingGrammar = await grammarService.getGrammar(req.params.id);
    if (!existingGrammar) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    let imagePath = existingGrammar.images || "";
    if (req.file) {
      if (existingGrammar.images) {
        const oldFilename = path.basename(existingGrammar.images);
        const oldFilePath = path.join(grammarService.imageFolder, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        const ext = path.extname(req.file.originalname);
        const newFilePath = path.join(grammarService.imageFolder, oldFilename);
        fs.renameSync(req.file.path, newFilePath);
        imagePath = `/static/images/grammar/${oldFilename}`;
      } else {
        imagePath = `/static/images/grammar/${req.file.filename}`;
      }
    }
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      quizzes: quizzes,
      images: imagePath,
    };
    const result = await grammarService.updateGrammar(req.params.id, grammar);
    res.json({ message: "Bài học ngữ pháp đã được cập nhật thành công !", result });
  } catch (error) {
    console.error("Update grammar error:", error);
    res.status(500).json({ message: "Error updating grammar", error });
  }
});

router.delete("/api/grammar/:id", async function (req, res) {
  try {
    const grammar = await grammarService.getGrammar(req.params.id);
    if (!grammar) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    if (grammar.images) {
      const filePath = path.join(grammarService.imageFolder, path.basename(grammar.images));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const result = await grammarService.deleteGrammar(req.params.id);
    if (result.deletedCount == 0) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    res.json({ message: "Bài học ngữ pháp đã xóa thành công !" });
  } catch (error) {
    console.error("Delete grammar error:", error);
    res.status(500).json({ message: "Error deleting grammar", error: error.message });
  }
});

module.exports = router;