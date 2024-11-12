const express = require("express");
const router = express.Router();
const GrammarexerciseService = require("../../services/grammarexerciseService");
const grammarexerciseService = new GrammarexerciseService();

router.get("/", function (req, res) {
    res.render("grammarexercises/grammarexercise");
});

router.get("/api/grammar-exercise", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
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

router.get("/add", function (req, res) {
    res.render("grammarexercises/addgrammarexercise");
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
        await grammarexerciseService.insertGrammarexercise({ title, questions });
        res.json({ success: true, message: "Bài luyện tập ngữ pháp đã được thêm thành công !" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding grammar exercise", error: err.message });
    }
});

router.get("/update/:id", async (req, res) => {
    try {
        const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        res.render("grammarexercises/updategrammarexercise", { exercise });
    } catch (err) {
        res.status(500).send("Error retrieving grammar exercise");
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
        const updatedExercise = await grammarexerciseService.updateGrammarexercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập ngữ pháp đã được cập nhật thành công !" });
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