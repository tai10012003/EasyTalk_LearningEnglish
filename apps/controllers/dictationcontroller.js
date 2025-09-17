const express = require("express");
const router = express.Router();
const DictationService = require("../services/dictationService");
const dictationExerciseService = new DictationService();

router.get("/api/dictation-exercises", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    
    try {
        const { dictationExercises, totalDictationExercises } = await dictationExerciseService.getDictationList(page, limit);
        const totalPages = Math.ceil(totalDictationExercises / limit);

        res.json({
            success: true,
            dictationExercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching dictation exercises:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dictation exercises",
        });
    }
});

router.get("/api/dictationexercise/:id", async (req, res) => {
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
