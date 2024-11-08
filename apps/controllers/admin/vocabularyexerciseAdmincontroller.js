const express = require("express");
const router = express.Router();
const VocabularyExerciseService = require("../../services/vocabularyexerciseService");
const vocabularyExerciseService = new VocabularyExerciseService();

// Route để hiển thị trang chủ
router.get("/", function (req, res) {
    res.render("vocabularyexercises/vocabularyexercise"); // Render trang danh sách bài từ vựng
});

router.get("/api/vocabulary-exercise", async (req, res) => {
    try {
        // Lấy các tham số phân trang từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
    
        // Gọi service để lấy danh sách bài tập từ vựng với phân trang
        const { vocabularyExercises, totalExercises } = await vocabularyExerciseService.getVocabularyExerciseList(page, limit);
    
        // Tính tổng số trang
        const totalPages = Math.ceil(totalExercises / limit);
    
        // Trả về kết quả dưới dạng JSON
        res.json({
          success: true,
          data: vocabularyExercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching vocabulary exercises:", error); // Ghi lỗi vào console
        res.status(500).json({ success: false, message: "Error fetching vocabulary exercises", error: error.message });
    }
});

// Route để hiển thị trang thêm bài tập từ vựng mới
router.get("/add", function (req, res) {
    res.render("vocabularyexercises/addvocabularyexercise"); // Render trang thêm bài tập từ vựng
});

// Route để thêm một bài tập từ vựng mới (API)
router.post("/add", async (req, res) => {
    const { title, questions } = req.body; // Lấy dữ liệu từ body của request

    // Kiểm tra tiêu đề có hợp lệ hay không
    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    // Kiểm tra xem mảng câu hỏi có hợp lệ hay không
    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        // Thêm bài tập từ vựng mới thông qua service
        await vocabularyExerciseService.insertVocabularyExercise({ title, questions });

        // Trả về phản hồi thành công
        res.json({ success: true, message: "Vocabulary exercise added successfully!" });
    } catch (err) {
        // Xử lý lỗi
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding vocabulary exercise", error: err.message });
    }
});

// Route để hiển thị trang cập nhật bài tập từ vựng
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
        return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        const updatedExercise = await vocabularyExerciseService.updateVocabularyExercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Vocabulary exercise not found." });
        }
        res.json({ success: true, message: "Vocabulary exercise updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating vocabulary exercise", error: err.message });
    }
});

// Route để xóa bài tập từ vựng (API)
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await vocabularyExerciseService.deleteVocabularyExercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Vocabulary exercise not found." });
        }
        res.json({ success: true, message: "Vocabulary exercise deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting vocabulary exercise", error: err.message });
    }
});

module.exports = router;
