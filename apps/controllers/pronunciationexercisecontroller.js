const express = require("express");
const router = express.Router();
const PronunciationExercise = require("../models/pronunciationexercise"); // Đảm bảo rằng bạn đã định nghĩa model này

// Hiển thị danh sách bài tập phát âm
router.get("/", async (req, res) => {
    try {
        const exercises = await PronunciationExercise.find();
        res.render("pronunciationexercises/pronunciationexercise-list", { exercises });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Hiển thị chi tiết một bài tập phát âm
router.get("/detail/:id", async (req, res) => {
    try {
        const exercise = await PronunciationExercise.findById(req.params.id);
        if (!exercise) {
            return res.status(404).send("Pronunciation exercise not found.");
        }
        res.render("pronunciationexercises/pronunciationexercise-detail", { exercise });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
