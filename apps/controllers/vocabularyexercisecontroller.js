const express = require("express");
const router = express.Router();
const VocabularyExerciseService = require("./../services/vocabularyexerciseService");
const vocabularyExerciseService = new VocabularyExerciseService();

// Display list of vocabulary exercises
router.get("/", async (req, res) => {
    try {
        // Call service method to get the list of vocabulary exercises
        const { vocabularyExercises } = await vocabularyExerciseService.getVocabularyExerciseList();
        // Render list view with vocabulary exercise data
        res.render("vocabularyexercises/vocabularyexercise-list", { exercises: vocabularyExercises });
    } catch (err) {
        res.status(500).send("Error retrieving vocabulary exercises: " + err.message);
    }
});

// API to fetch vocabulary exercises with pagination
router.get("/api/vocabulary-exercises", async (req, res) => {
    try {
        // Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
    
        // Call service to get vocabulary exercises with pagination
        const { vocabularyExercises, totalExercises } = await vocabularyExerciseService.getVocabularyExerciseList(page, limit);
    
        // Calculate total pages
        const totalPages = Math.ceil(totalExercises / limit);
    
        // Return result as JSON
        res.json({
          success: true,
          data: vocabularyExercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching vocabulary exercises:", error); // Log error to console
        res.status(500).json({ success: false, message: "Error fetching vocabulary exercises", error: error.message });
    }
});

// Display details of a specific vocabulary exercise
router.get('/detail/:id', (req, res) => {
    res.render('vocabularyexercises/vocabularyexercise-detail');
});

// API to fetch details of a specific vocabulary exercise by ID
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
