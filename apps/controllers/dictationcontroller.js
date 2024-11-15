const express = require("express");
const router = express.Router();
const DictationService = require("../services/dictationService");
const dictationExerciseService = new DictationService()
// Endpoint để trả về danh sách bài tập dictation cho giao diện trang chính với phân trang
router.get("/api/dictation-exercises", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        
        const { dictationExercises, totalExercises } = await dictationExerciseService.getDictationList(page, limit);
        
        const totalPages = Math.ceil(totalExercises / limit);
        
        res.json({
            success: true,
            data: dictationExercises,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error("Error fetching dictation exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercises", error: error.message });
    }
});

// Endpoint để trả về giao diện hiển thị danh sách
router.get("/", (req, res) => {
    res.render("dictationexercises/dictationexercise-list");
});

router.get("/detail/:id", (req, res) => {
    res.render("dictationexercises/dictationexercise-detail");
});

router.get("/api/:id", async (req, res) => {
    try {
        const dictationExercise = await dictationExerciseService.getDictation(req.params.id);

        if (!dictationExercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }

        res.json({ success: true, data: dictationExercise });
    } catch (error) {
        console.error("Error fetching dictation exercise details:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercise details", error: error.message });
    }
});


module.exports = router;