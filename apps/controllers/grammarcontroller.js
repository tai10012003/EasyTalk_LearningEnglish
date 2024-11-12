const express = require("express");
const router = express.Router();
const GrammarService = require("../services/grammarService");

router.get("/api/grammar-list", async function (req, res) {
    const grammarService = new GrammarService();
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
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
  
router.get('/', (req, res) => {
    res.render('grammars/grammar-list');
});

router.get('/detail/:id', (req, res) => {
  res.render('grammars/grammar-detail');
});

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
