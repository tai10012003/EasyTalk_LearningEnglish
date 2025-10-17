const express = require("express");
const router = express.Router();
const { DictationService } = require("../services");
const dictationService = new DictationService();

router.get("/api/dictation-exercises", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    try {
        const { dictationExercises, totalDictationExercises } = await dictationService.getDictationList(page, limit);
        const totalPages = Math.ceil(totalDictationExercises / limit);
        res.json({
            success: true,
            dictationExercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching dictation exercises:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dictation exercises",
        });
    }
});

router.get("/api/dictationexercise/:id", async (req, res) => {
    try {
        const dictationExercise = await dictationService.getDictation(req.params.id);
        if (!dictationExercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }
        res.json({ success: true, data: dictationExercise });
    } catch (error) {
        console.error("Error fetching dictation exercise details:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercise details", error: error.message });
    }
});

router.post("/add", async function (req, res) {
    try {
        const dictationexercises = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
        };
        const result = await dictationService.insertDictation(dictationexercises);
        res.status(201).json({ message: "Bài nghe chép chính tả đã được thêm thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding dictation exercise", error });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await dictationService.getDictation(req.params.id);
        if (!exercise) {
        return res.status(404).json({ message: "Dictation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching dictation exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async function (req, res) {
    try {
        const dictationexercises = {
            _id: req.params.id,
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
        };
        const result = await dictationService.updateDictation(dictationexercises);
        res.json({ message: "Bài nghe chép chính tả đã được cập nhật thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error updating dictation exercise", error });
    }
});

router.delete("/delete/:id", async function (req, res) {
    const result = await dictationService.deleteDictation(req.params.id);
    if (result.deletedCount == 0) {
        return res.status(404).json({ message: "Bài nghe chép chính tả không tìm thấy." });
    }
    res.json({ message: "Bài nghe chép chính tả đã xóa thành công!" });
});

module.exports = router;