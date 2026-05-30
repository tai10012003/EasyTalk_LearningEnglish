const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const GrammarExerciseService = require("../services/grammarexerciseService");
const { validateGrammarExerciseInput, buildGrammarExerciseDataFromRequest } = require("../validators/grammarexerciseValidator");
const grammarexerciseService = new GrammarExerciseService();

router.get("/api/grammar-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { grammarexercises, totalExercises } = await grammarexerciseService.getGrammarexerciseList(page, limit, role);
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

router.get("/api/grammar-exercises/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await grammarexerciseService.getGrammarExerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Error fetching grammar exercise details:", err);
        res.status(500).json({ message: "Error fetching grammar exercise details", error: err.message });
    }
});

router.get("/api/grammar-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const slug = req.params.slug;
        const exercise = await grammarexerciseService.getGrammarexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching Grammar exercise details by slug:", err);
        res.status(500).json({ message: "Error fetching Grammar exercise details", error: err.message });
    }
});

router.post("/api/grammar-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await grammarexerciseService.completeGrammarExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing grammar exercise: ", error);
        res.status(500).json({
            success: false,
            message: "Error processing completion",
            error: error.message
        });
    }
});

router.post("/add", async (req, res) => {
    try {
        const validation = validateGrammarExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await grammarexerciseService.insertGrammarexercise(buildGrammarExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error adding grammar exercise",
            error: err.message
        });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching grammar exercise:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const validation = validateGrammarExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }
        const { status, data } = await grammarexerciseService.updateGrammarexercise(req.params.id, buildGrammarExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    } catch (err) {
        console.error("Update grammar exercise error:", err);
        return res.status(500).json({
            success: false,
            message: "Error updating grammar exercise",
            error: err.message
        });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const { status, data } = await grammarexerciseService.deleteGrammarexercise(req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Delete grammar exercise error:", err);
        res.status(500).json({
            success: false,
            message: "Error deleting grammar exercise",
            error: err.message
        });
    }
});

module.exports = router;