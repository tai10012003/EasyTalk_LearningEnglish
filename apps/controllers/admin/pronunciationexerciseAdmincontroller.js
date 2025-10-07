const express = require("express");
const router = express.Router();
const PronunciationexerciseService = require("../../services/pronunciationexerciseService");
const pronunciationexerciseService = new PronunciationexerciseService();

router.get("/api/pronunciation-exercise", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
            success: true,
            data: pronunciationexercises,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching pronunciation exercises", error: err.message });
    }
});

router.post("/add", async (req, res) => {
    try {
        const pronunciationexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await pronunciationexerciseService.insertPronunciationexercise(pronunciationexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập phát âm đã được thêm thành công !", result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding pronunciation exercise", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!exercise) {
        return res.status(404).json({ message: "Pronunciation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching pronunciation exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const existingPronunciationExercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!existingPronunciationExercise) {
            return res.status(404).json({ message: "Bài luyện tập phát âm không tìm thấy." });
        }
        const pronunciationexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, pronunciationexercise);
        res.json({ message: "Bài luyện tập phát âm đã được cập nhật thành công !", result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating pronunciation exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await pronunciationexerciseService.deletePronunciationexercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập phát âm không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập phát âm đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting pronunciation exercise", error: err.message });
    }
});

module.exports = router;
