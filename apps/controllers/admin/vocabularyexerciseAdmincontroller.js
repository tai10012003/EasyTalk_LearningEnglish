const express = require("express");
const router = express.Router();
const VocabularyExerciseService = require("../../services/vocabularyexerciseService");
const vocabularyExerciseService = new VocabularyExerciseService();

router.get("/", function (req, res) {
    res.render("vocabularyexercises/vocabularyexercise");
});

router.get("/api/vocabulary-exercise", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const { vocabularyExercises, totalExercises } = await vocabularyExerciseService.getVocabularyExerciseList(page, limit);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
          success: true,
          data: vocabularyExercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching vocabulary exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching vocabulary exercises", error: error.message });
    }
});

router.get("/add", function (req, res) {
    res.render("vocabularyexercises/addvocabularyexercise");
});

router.post("/add", async (req, res) => {
    const { title, questions } = req.body;
    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Tiêu đề không để trống." });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ." });
    }
    try {
        await vocabularyExerciseService.insertVocabularyExercise({ title, questions });
        res.json({ success: true, message: "Bài luyện tập từ vựng đã được thêm thành công !" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding vocabulary exercise", error: err.message });
    }
});

router.get("/update/:id", async (req, res) => {
    try {
        const exercise = await vocabularyExerciseService.getVocabularyExerciseById(req.params.id);
        res.render("vocabularyexercises/updatevocabularyexercise", { exercise });
    } catch (err) {
        res.status(500).send("Error retrieving vocabulary exercise");
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
        const updatedExercise = await vocabularyExerciseService.updateVocabularyExercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập từ vựng không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập từ vựng đã được cập nhật thành công !" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating vocabulary exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await vocabularyExerciseService.deleteVocabularyExercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập từ vựng không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập từ vựng đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting vocabulary exercise", error: err.message });
    }
});

module.exports = router;
