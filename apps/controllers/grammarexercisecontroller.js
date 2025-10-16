const express = require("express");
const router = express.Router();
const { GrammarexerciseService } = require("./../services");
const grammarexerciseService = new GrammarexerciseService();

router.get("/api/grammar-exercises", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const { grammarexercises, totalExercises } = await grammarexerciseService.getGrammarexerciseList(page, limit);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
          success: true,
          data: grammarexercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching grammar exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching grammar exercises", error: error.message });
    }
});

router.get("/api/grammar-exercises/:id", async function (req, res) {
    try {
        const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar exercise not found." });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammar exercise details", error: err });
    }
});

router.post("/add", async (req, res) => {
    try {
        const grammarexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await grammarexerciseService.insertGrammarexercise(grammarexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập ngữ pháp đã được thêm thành công !", result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding grammar exercise", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!exercise) {
        return res.status(404).json({ message: "Grammar Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching grammar exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const existingGrammarExercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!existingGrammarExercise) {
            return res.status(404).json({ message: "Bài luyện tập ngữ pháp không tìm thấy." });
        }
        const grammarexercise = {
            title: req.body.title,
            questions: req.body.questions || []
        };
        const result = await grammarexerciseService.updateGrammarexercise(req.params.id, grammarexercise);
        res.json({ message: "Bài luyện tập ngữ pháp đã được cập nhật thành công !", result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating grammar exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await grammarexerciseService.deleteGrammarexercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập ngữ pháp đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting grammar exercise", error: err.message });
    }
});

module.exports = router;