var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var GrammarService = require("./../../services/grammarService");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", function (req, res) {
    res.render("grammars/grammar");
});

router.get("/add", function (req, res) {
  res.render("grammars/addgrammar");
});

router.get("/update", async function (req, res) {
  const grammarService = new GrammarService();
  const grammar = await grammarService.getGrammar(req.query.id);
  res.render("grammars/updategrammar", { grammar });
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
        const grammar = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            images: req.file ? req.file.buffer : null
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
      const grammar = {
        _id: new ObjectId(req.params.id),
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
      };
      if (req.file) {
        grammar.images = req.file.buffer;
      } else {
        const existingGrammar = await grammarService.getGrammar(req.params.id);
        if (!existingGrammar) {
          return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
        }
        grammar.images = existingGrammar.images;
      }
      const result = await grammarService.updateGrammar(grammar);
      res.json({ message: "Bài học ngữ pháp đã được cập nhật thành công !", result });
    } catch (error) {
      res.status(500).json({ message: "Error updating grammar", error });
    }
  }
);

router.delete("/api/grammar/:id", async function (req, res) {
    const grammarService = new GrammarService();
    const result = await grammarService.deleteGrammar(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    res.json({ message: "Bài học ngữ pháp đã xóa thành công !" });
});

module.exports = router;
