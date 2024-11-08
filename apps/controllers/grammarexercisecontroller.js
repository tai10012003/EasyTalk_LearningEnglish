const express = require("express");
const router = express.Router();
const GrammarexerciseService = require("./../services/grammarexerciseService");
const grammarExerciseService = new GrammarexerciseService();

// Hiển thị danh sách bài tập ngữ pháp
router.get("/", async (req, res) => {
    try {
        // Gọi phương thức từ service để lấy danh sách bài tập ngữ pháp
        const { grammarexercises } = await grammarExerciseService.getGrammarexerciseList();
        // Render giao diện danh sách với dữ liệu bài tập ngữ pháp
        res.render("grammarexercises/grammarexercise-list", { exercises: grammarexercises });
    } catch (err) {
        res.status(500).send("Error retrieving grammar exercises: " + err.message);
    }
});
router.get("/api/grammar-exercises", async (req, res) => {
    try {
        // Lấy các tham số phân trang từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
    
        // Gọi service để lấy danh sách bài tập ngữ pháp với phân trang
        const { grammarexercises, totalExercises } = await grammarExerciseService.getGrammarexerciseList(page, limit);
    
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
router.get('/detail/:id', (req, res) => {
    res.render('grammarexercises/grammarexercise-detail');
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await grammarExerciseService.getGrammarexerciseById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: "Grammar exercise not found." });
        }

        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammar exercise details", error: err });
    }
});

module.exports = router;