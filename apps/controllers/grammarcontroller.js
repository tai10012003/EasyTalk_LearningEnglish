const express = require("express");
const router = express.Router();
const Grammar = require("../models/grammar");
const GrammarService = require("../services/grammarService");

// API để lấy danh sách bài ngữ pháp (với phân trang)
router.get("/api/grammar-list", async function (req, res) {
    const grammarService = new GrammarService();
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // Số lượng bài ngữ pháp trên mỗi trang
  
    try {
      const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit);
      const totalPages = Math.ceil(totalGrammars / limit);
  
      res.json({
        grammars,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching grammars", error: err });
    }
  });
  
// Hiển thị trang chính (sẽ gọi API thông qua AJAX)
router.get('/', (req, res) => {
    res.render('grammars/grammar-list');
});
// Hiển thị trang chi tiết bài học ngữ pháp
router.get('/detail/:id', (req, res) => {
  res.render('grammars/grammar-detail');
});

// API để lấy thông tin một bài ngữ pháp theo ID
router.get("/api/:id", async function (req, res) {
  const grammarService = new GrammarService();
  try {
    const grammar = await grammarService.getGrammar(req.params.id);

    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }

    res.json(grammar);
  } catch (err) {
    res.status(500).json({ message: "Error fetching grammar details", error: err });
  }
});


module.exports = router;
