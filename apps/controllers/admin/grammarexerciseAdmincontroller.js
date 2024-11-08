const express = require("express");
const router = express.Router();
const GrammarexerciseService = require("../../services/grammarexerciseService");
const grammarexerciseService = new GrammarexerciseService();


// Route để hiển thị trang chủ
router.get("/", function (req, res) {
    res.render("grammarexercises/grammarexercise"); // Render trang danh sách bài ngữ pháp
});

router.get("/api/grammar-exercise", async (req, res) => {
    try {
        // Lấy các tham số phân trang từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
    
        // Gọi service để lấy danh sách bài tập ngữ pháp với phân trang
        const { grammarexercises, totalExercises } = await grammarexerciseService.getGrammarexerciseList(page, limit);
    
        // Tính tổng số trang
        const totalPages = Math.ceil(totalExercises / limit);
    
        // Trả về kết quả dưới dạng JSON
        res.json({
          success: true,
          data: grammarexercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching grammar exercises:", error); // Ghi lỗi vào console
        res.status(500).json({ success: false, message: "Error fetching grammar exercises", error: error.message });
    }
});


// Route để hiển thị trang chủ
router.get("/add", function (req, res) {
    res.render("grammarexercises/addgrammarexercise"); // Render trang danh sách bài ngữ pháp
});
// Route để thêm một bài tập ngữ pháp mới (API)
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
        // Thêm bài tập ngữ pháp mới thông qua service
        await grammarexerciseService.insertGrammarexercise({ title, questions });

        // Trả về phản hồi thành công
        res.json({ success: true, message: "Grammar exercise added successfully!" });
    } catch (err) {
        // Xử lý lỗi
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding grammar exercise", error: err.message });
    }
});


// Route để hiển thị trang cập nhật bài tập ngữ pháp
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
        return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        const updatedExercise = await grammarexerciseService.updateGrammarexercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Grammar exercise not found." });
        }
        res.json({ success: true, message: "Grammar exercise updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating grammar exercise", error: err.message });
    }
});


// Route để xóa bài tập ngữ pháp (API)
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await grammarexerciseService.deleteGrammarexercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Grammar exercise not found." });
        }
        res.json({ success: true, message: "Grammar exercise deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting grammar exercise", error: err.message });
    }
});

module.exports = router;