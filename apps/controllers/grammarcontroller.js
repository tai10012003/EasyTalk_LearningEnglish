const express = require("express");
const router = express.Router();
var multer = require("multer");
const Grammar = require("../models/grammar");

router.get("/", (req, res) => {
    Grammar.find()
        .then(grammars => {
            res.render("grammars/grammar-list", { grammars });
        })
        .catch(err => res.status(500).send(err));
});

// Hiển thị danh sách bài học ngữ pháp
router.get('/grammar', async (req, res) => {
    const grammars = await Grammar.find();
    res.render('grammars/grammar-list', { grammars });
});

router.get('/grammar/detail/:id', async (req, res) => {
    const grammar = await Grammar.findById(req.params.id);
    res.render('grammars/grammar-detail', { grammar });
});


module.exports = router;
