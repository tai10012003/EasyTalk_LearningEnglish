const express = require("express");
const router = express.Router();
const VocabularyExerciseService = require("./../services/vocabularyexerciseService");
const vocabularyExerciseService = new VocabularyExerciseService();

router.get("/", async (req, res) => {
    try {
        const { vocabularyExercises } = await vocabularyExerciseService.getVocabularyExerciseList();
        res.render("vocabularyexercises/vocabularyexercise-list", { exercises: vocabularyExercises });
    } catch (err) {
        res.status(500).send("Error retrieving vocabulary exercises: " + err.message);
    }
});

router.get("/api/vocabulary-exercises", async (req, res) => {
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

router.get('/detail/:id', (req, res) => {
    res.render('vocabularyexercises/vocabularyexercise-detail');
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await vocabularyExerciseService.getVocabularyExerciseById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary exercise not found." });
        }

        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching vocabulary exercise details", error: err });
    }
});

module.exports = router;
