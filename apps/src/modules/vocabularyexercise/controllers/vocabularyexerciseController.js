const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const VocabularyExerciseService = require("../services/vocabularyexerciseService");
const { validateVocabularyExerciseInput, buildVocabularyExerciseDataFromRequest } = require("../validators/vocabularyexerciseValidator");
const vocabularyexerciseService = new VocabularyExerciseService();

router.get("/api/vocabulary-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { vocabularyexercises, totalExercises } = await vocabularyexerciseService.getVocabularyexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
            success: true,
            data: vocabularyexercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching vocabulary exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching vocabulary exercises", error: error.message });
    }
});

router.get("/api/vocabulary-exercises/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await vocabularyexerciseService.getVocabularyExerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Error fetching vocabulary exercise details:", err);
        res.status(500).json({ message: "Error fetching vocabulary exercise details", error: err.message });
    }
});

router.get("/api/vocabulary-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const slug = req.params.slug;
        const exercise = await vocabularyexerciseService.getVocabularyexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching Vocabulary exercise details by slug:", err);
        res.status(500).json({ message: "Error fetching Vocabulary exercise details", error: err.message });
    }
});

router.post("/api/vocabulary-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await vocabularyexerciseService.completeVocabularyExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing vocabulary exercise: ", error);
        res.status(500).json({
            success: false,
            message: "Error processing completion",
            error: error.message
        });
    }
});

router.post("/add", verifyAdmin, async (req, res) => {
    try {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await vocabularyexerciseService.insertVocabularyexercise(buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error adding vocabulary exercise",
            error: err.message
        });
    }
});

router.get("/api/:id", verifyAdmin, cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await vocabularyexerciseService.getVocabularyexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching vocabulary exercise:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/update/:id", verifyAdmin, async (req, res) => {
    try {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }
        const { status, data } = await vocabularyexerciseService.updateVocabularyexercise(req.params.id, buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (err) {
        console.error("Update vocabulary exercise error:", err);
        return res.status(500).json({
            success: false,
            message: "Error updating vocabulary exercise",
            error: err.message
        });
    }
});

router.delete("/delete/:id", verifyAdmin, async (req, res) => {
    try {
        const { status, data } = await vocabularyexerciseService.deleteVocabularyexercise(req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Delete vocabulary exercise error:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting vocabulary exercise",
            error: err.message
        });
    }
});

module.exports = router;
