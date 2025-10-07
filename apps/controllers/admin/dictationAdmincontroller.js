var express = require("express");
var router = express.Router();
var DictationService = require("./../../services/dictationService");
const dictationService = new DictationService();

router.get("/api/dictation-list", async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const { dictationExercises, totalDictationExercises } = await dictationService.getDictationList(page, limit);
    const totalPages = Math.ceil(totalDictationExercises / limit);
    res.json({
        dictationExercises,
        currentPage: page,
        totalPages,
    });
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