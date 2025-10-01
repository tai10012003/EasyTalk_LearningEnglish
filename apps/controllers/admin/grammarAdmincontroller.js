var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var GrammarService = require("./../../services/grammarService");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const grammarImagePath = path.join(__dirname, "../../public/assets/images/grammar");

if (!fs.existsSync(grammarImagePath)) {
  fs.mkdirSync(grammarImagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, grammarImagePath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

router.get("/", function (req, res) {
    res.render("grammars/grammar");
});

router.get("/add", function (req, res) {
  res.render("grammars/addgrammar");
});

router.get("/api/:id", async function (req, res) {
  try {
    const grammarService = new GrammarService();
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
  const grammarService = new GrammarService();
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
  const grammarService = new GrammarService();
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
      images: req.file ? `/assets/images/grammar/${req.file.filename}` : null,
      quizzes: quizzes
    };
    const result = await grammarService.insertGrammar(grammar);
    res.status(201).json({ message: "Bài học ngữ pháp đã được thêm thành công !", result });
  } catch (error) {
    res.status(500).json({ message: "Error adding grammar", error });
  }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
  const grammarService = new GrammarService();
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
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      quizzes: quizzes,
      images: req.file
        ? `/assets/images/grammar/${req.file.filename}`
        : req.body.images || existingGrammar.images || "",
    };
    const result = await grammarService.updateGrammar(req.params.id, grammar);
    res.json({ message: "Bài học ngữ pháp đã được cập nhật thành công !", result });
  } catch (error) {
    console.error("Update grammar error:", error);
    res.status(500).json({ message: "Error updating grammar", error });
  }
});

router.delete("/api/grammar/:id", async function (req, res) {
    const grammarService = new GrammarService();
    const result = await grammarService.deleteGrammar(req.params.id);
    if (result.deletedCount == 0) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    res.json({ message: "Bài học ngữ pháp đã xóa thành công !" });
});

module.exports = router;