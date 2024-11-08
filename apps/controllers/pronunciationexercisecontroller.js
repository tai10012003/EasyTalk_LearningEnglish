const express = require("express");
const router = express.Router();
const PronunciationExerciseService = require("../services/pronunciationexerciseService");
const pronunciationExerciseService = new PronunciationExerciseService();

router.get("/", async (req, res) => {
    try {
        const { pronunciationexercises } = await pronunciationExerciseService.getPronunciationexerciseList();
        res.render("pronunciationexercises/pronunciationexercise-list", { exercises: pronunciationexercises });
    } catch (err) {
        console.error("Error retrieving pronunciation exercises:", err);
        res.status(500).send("Error retrieving pronunciation exercises: " + err.message);
    }
});

router.get("/api/pronunciation-exercises", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const { pronunciationexercises, totalExercises } = await pronunciationExerciseService.getPronunciationexerciseList(page, limit);
    
        const totalPages = Math.ceil(totalExercises / limit);
    
        res.json({
          success: true,
          data: pronunciationexercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching pronunciation exercises:", error); // Ghi lỗi vào console
        res.status(500).json({ success: false, message: "Error fetching pronunciation exercises", error: error.message });
    }
});


router.get('/detail/:id', (req, res) => {
    res.render('pronunciationexercises/pronunciationexercise-detail');
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await pronunciationExerciseService.getPronunciationexerciseById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }

        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err });
    }
});

module.exports = router;
