const express = require("express");
const router = express.Router();
var multer = require("multer");
const Pronunciation = require("../models/pronunciation");

router.get("/", (req, res) => {
    Pronunciation.find()
        .then(pronunciations => {
            res.render("pronunciations/pronunciation-list", { pronunciations });
        })
        .catch(err => res.status(500).send(err));
});

// Hiển thị danh sách bài học ngữ pháp
router.get('/pronunciation', async (req, res) => {
    const pronunciations = await Pronunciation.find();
    res.render('pronunciations/pronunciation-list', { pronunciations });
});

router.get('/pronunciation/detail/:id', async (req, res) => {
    const pronunciation = await Pronunciation.findById(req.params.id);
    res.render('pronunciations/pronunciation-detail', { pronunciation });
});


module.exports = router;
