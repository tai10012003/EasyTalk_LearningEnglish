const express = require("express");
const router = express.Router();
const GrammarexerciseService = require("./../services/grammarexerciseService");
const grammarExerciseService = new GrammarexerciseService();

router.get("/", async (req, res) => {
    try {
        const { grammarexercises } = await grammarExerciseService.getGrammarexerciseList();
        res.render("grammarexercises/grammarexercise-list", { exercises: grammarexercises });
    } catch (err) {
        res.status(500).send("Error retrieving grammar exercises: " + err.message);
    }
});
router.get("/api/grammar-exercises", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const { grammarexercises, totalExercises } = await grammarExerciseService.getGrammarexerciseList(page, limit);
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