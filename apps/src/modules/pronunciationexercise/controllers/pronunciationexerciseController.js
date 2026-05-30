const express = require("express");
const router = express.Router();
const multer = require('multer');
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const PronunciationExerciseService = require("../services/pronunciationexerciseService");
const { validatePronunciationExerciseInput, buildPronunciationExerciseDataFromRequest } = require("../validators/pronunciationexerciseValidator");

const pronunciationexerciseService = new PronunciationExerciseService();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/pronunciation-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({ success: true, data: pronunciationexercises, currentPage: page, totalPages });
    } catch (error) {
        console.error("Error fetching pronunciation exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching pronunciation exercises", error: error.message });
    }
});

router.get("/api/pronunciation-exercises/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await pronunciationexerciseService.getPronunciationexerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err.message });
    }
});

router.get("/api/pronunciation-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseBySlug(req.params.slug);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err.message });
    }
});

router.post('/analyze/:id/:index', upload.single('audio'), async (req, res) => {
    try {
        const audioBuffer = req.file ? req.file.buffer : null;
        const questionIndex = parseInt(req.params.index, 10);
        const { status, data } = await pronunciationexerciseService.analyzePronunciation(audioBuffer, req.params.id, questionIndex);
        return res.status(status).json(data);
    } catch (error) {
        console.error('Lỗi khi phân tích giọng nói:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi phân tích giọng nói', detail: error.message });
    }
});

router.post("/api/pronunciation-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await pronunciationexerciseService.completePronunciationexercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing pronunciation exercise: ", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/add", async (req, res) => {
    try {
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await pronunciationexerciseService.insertPronunciationexercise(buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
    } catch (err) {
        console.error("Add pronunciation exercise error:", err);
        return res.status(500).json({ success: false, message: "Error adding pronunciation exercise", error: err.message });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching pronunciation exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
    } catch (err) {
        console.error("Update pronunciation exercise error:", err);
        return res.status(500).json({ success: false, message: "Error updating pronunciation exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const { status, data } = await pronunciationexerciseService.deletePronunciationexercise(req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Delete pronunciation exercise error:", err);
        res.status(500).json({ success: false, message: "Error deleting pronunciation exercise", error: err.message });
    }
});

module.exports = router;