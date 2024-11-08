const express = require("express");
const router = express.Router();
const PronunciationexerciseService = require("../../services/pronunciationexerciseService");
const pronunciationexerciseService = new PronunciationexerciseService();

// Route để hiển thị trang chủ
router.get("/", function (req, res) {
    res.render("pronunciationexercises/pronunciationexercise"); // Render trang danh sách bài tập phát âm
});

// Route để lấy danh sách bài tập phát âm (API) với phân trang
router.get("/api/pronunciation-exercise", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Lấy page từ query string, mặc định là 1
        const limit = parseInt(req.query.limit) || 2; // Lấy limit từ query string, mặc định là 10

        // Gọi service để lấy danh sách bài tập phát âm với phân trang
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit);

        // Tính tổng số trang
        const totalPages = Math.ceil(totalExercises / limit);

        // Trả về kết quả dưới dạng JSON
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

// Route để hiển thị trang thêm bài tập phát âm
router.get("/add", function (req, res) {
    res.render("pronunciationexercises/addpronunciationexercise"); // Render trang thêm bài tập phát âm
});

// Route để thêm một bài tập phát âm mới (API)
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
        // Thêm bài tập phát âm mới thông qua service
        await pronunciationexerciseService.insertPronunciationexercise({ title, questions });

        // Trả về phản hồi thành công
        res.json({ success: true, message: "Pronunciation exercise added successfully!" });
    } catch (err) {
        // Xử lý lỗi
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding pronunciation exercise", error: err.message });
    }
});

// Route để hiển thị trang cập nhật bài tập phát âm
router.get("/update/:id", async (req, res) => {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        res.render("pronunciationexercises/updatepronunciationexercise", { exercise });
    } catch (err) {
        res.status(500).send("Error retrieving pronunciation exercise");
    }
});

// Route để cập nhật bài tập phát âm (API)
router.post("/update/:id", async (req, res) => {
    const { title, questions } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        const updatedExercise = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, { title, questions });
        if (!updatedExercise) {
            return res.status(404).json({ success: false, message: "Pronunciation exercise not found." });
        }
        res.json({ success: true, message: "Pronunciation exercise updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating pronunciation exercise", error: err.message });
    }
});

// Route để xóa bài tập phát âm (API)
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await pronunciationexerciseService.deletePronunciationexercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Pronunciation exercise not found." });
        }
        res.json({ success: true, message: "Pronunciation exercise deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting pronunciation exercise", error: err.message });
    }
});

module.exports = router;
