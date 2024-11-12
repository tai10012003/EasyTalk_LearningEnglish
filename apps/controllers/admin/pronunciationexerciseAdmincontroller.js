const express = require("express");
const router = express.Router();
const PronunciationexerciseService = require("../../services/pronunciationexerciseService");
const pronunciationexerciseService = new PronunciationexerciseService();

router.get("/", function (req, res) {
    res.render("pronunciationexercises/pronunciationexercise");
});

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

router.get("/add", function (req, res) {
    res.render("pronunciationexercises/addpronunciationexercise");
});

router.post("/add", async (req, res) => {
    const { title, questions } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Tiêu đề không tìm thấy." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ." });
    }

    try {
        await pronunciationexerciseService.insertPronunciationexercise({ title, questions });
        res.json({ success: true, message: "Bài luyện tập phát âm đã được thêm thành công !" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding pronunciation exercise", error: err.message });
    }
});

router.get("/update/:id", async (req, res) => {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        res.render("pronunciationexercises/updatepronunciationexercise", { exercise });
    } catch (err) {
        res.status(500).send("Error retrieving pronunciation exercise");
    }
});

router.post("/update/:id", async (req, res) => {
    const { title, questions } = req.body;
    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Tiêu đề không để trống." });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ." });
    }

    try {
        const updatedExercise = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập phát âm không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập phát âm đã được cập nhật thành công !" });
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
