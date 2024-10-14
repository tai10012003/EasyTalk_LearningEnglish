const express = require("express");
const router = express.Router();
const GrammarExercise = require("../models/grammarexercise"); // Đảm bảo rằng bạn đã định nghĩa model này

// Hiển thị danh sách bài tập ngữ pháp
router.get("/", async (req, res) => {
    try {
        const exercises = await GrammarExercise.find();
        res.render("grammarexercises/grammarexercise-list", { exercises });
    } catch (err) {
        res.status(500).send(err);
    }
});
// Hiển thị danh sách bài học ngữ pháp
router.get('/grammar-exercise', async (req, res) => {
    const exercises = await GrammarExercise.find();
    res.render('grammarexercises/grammarexercise-list', { exercises });
});
// Hiển thị chi tiết một bài tập ngữ pháp
router.get("/detail/:id", async (req, res) => {
    try {
        const exercise = await GrammarExercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).send("Grammar exercise not found.");
        }
        res.render("grammarexercises/grammarexercise-detail", { exercise });
    } catch (err) {
        res.status(500).send(err);
    }
});
module.exports = router;