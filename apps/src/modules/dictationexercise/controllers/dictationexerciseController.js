const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const DictationExerciseService = require("../../dictationexercise/services/dictationexerciseService");
const { validateDictationExerciseInput, buildDictationExerciseDataFromRequest } = require("../validators/dictationexerciseValidator");

const dictationexerciseService = new DictationExerciseService();

router.get("/api/dictation-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { dictationExercises, totalDictationExercises } = await dictationexerciseService.getDictationList(page, limit, role);
        const totalPages = Math.ceil(totalDictationExercises / limit);
        res.json({
            success: true,
            dictationExercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching dictation exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercises" });
    }
});

router.get("/api/dictationexercise/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await dictationexerciseService.getDictationExerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Error fetching dictation exercise details:", err);
        res.status(500).json({ message: "Error fetching dictation exercise details", error: err.message });
    }
});

router.get("/api/dictationexercise/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const dictationExercise = await dictationexerciseService.getDictationBySlug(req.params.slug);
        if (!dictationExercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }
        res.json({ success: true, data: dictationExercise });
    } catch (error) {
        console.error("Error fetching dictation exercise details:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercise details", error: error.message });
    }
});

router.post("/api/dictation-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await dictationexerciseService.completeDictationExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing dictation exercise: ", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/add", verifyAdmin, async function (req, res) {
    try {
        const validation = validateDictationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await dictationexerciseService.insertDictation(buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error adding dictation exercise", error: error.message });
    }
});

router.get("/api/:id", verifyAdmin, cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await dictationexerciseService.getDictation(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Dictation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching dictation exercise:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/update/:id", verifyAdmin, async function (req, res) {
    try {
        const validation = validateDictationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await dictationexerciseService.updateDictation(req.params.id, buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (error) {
        console.error("Update dictation exercise error:", error);
        res.status(500).json({ success: false, message: "Error updating dictation exercise", error: error.message });
    }
});

router.delete("/delete/:id", verifyAdmin, async function (req, res) {
    try {
        const { status, data } = await dictationexerciseService.deleteDictation(req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Delete dictation exercise error:", err);
        res.status(500).json({ success: false, message: "Error deleting dictation exercise", error: err.message });
    }
});

module.exports = router;
