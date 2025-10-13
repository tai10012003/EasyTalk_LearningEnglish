const express = require("express");
const router = express.Router();
const VocabularyexerciseService = require("../../services/vocabularyexerciseService");
const vocabularyexerciseService = new VocabularyexerciseService();

router.get("/api/vocabulary-exercise", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const { vocabularyExercises, totalExercises } = await vocabularyexerciseService.getVocabularyExerciseList(page, limit);
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

router.post("/add", async (req, res) => {
    try {
        const vocabularyexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await vocabularyexerciseService.insertVocabularyExercise(vocabularyexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập từ vựng đã được thêm thành công !", result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding vocabulary exercise", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await vocabularyexerciseService.getVocabularyExerciseById(req.params.id);
        if (!exercise) {
        return res.status(404).json({ message: "Vocabulary Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching vocabulary exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const existingVocabularyExercise = await vocabularyexerciseService.getVocabularyExerciseById(req.params.id);
        if (!existingVocabularyExercise) {
            return res.status(404).json({ message: "Bài luyện tập từ vựng không tìm thấy." });
        }
        const vocabularyexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await vocabularyexerciseService.updateVocabularyExercise(req.params.id, vocabularyexercise);
        res.json({ message: "Bài luyện tập từ vựng đã được cập nhật thành công !", result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating vocabulary exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await vocabularyexerciseService.deleteVocabularyExercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập từ vựng không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập từ vựng đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting vocabulary exercise", error: err.message });
    }
});

module.exports = router;
