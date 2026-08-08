const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const GrammarExerciseService = require("../services/grammarexerciseService");
const { validateGrammarExerciseInput, buildGrammarExerciseDataFromRequest } = require("../validators/grammarexerciseValidator");
let grammarexerciseService = new GrammarExerciseService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

router.get("/api/grammar-exercises", verifyToken, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const role = req.user.role || "user";
    const lang = req.query.lang === "en" ? "en" : "vi";
    const { grammarexercises, totalExercises } = await grammarexerciseService.getGrammarexerciseList(page, limit, role, lang);
    const totalPages = Math.ceil(totalExercises / limit);
    res.json({
        success: true,
        data: grammarexercises,
        currentPage: page,
        totalPages,
    });
}));

router.get("/api/grammar-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
    const lang = req.query.lang === "en" ? "en" : "vi";
    const { status, data } = await grammarexerciseService.getGrammarExerciseDetails(req.user.id, req.params.id, lang);
    return res.status(status).json(data);
}));

router.get("/api/grammar-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
    const slug = req.params.slug;
    const lang = req.query.lang === "en" ? "en" : "vi";
    const exercise = await grammarexerciseService.getLocalizedGrammarexerciseBySlug(slug, lang);
    if (!exercise) {
        return res.status(404).json({ message: "Grammar exercise not found" });
    }
    res.json(exercise);
}));

router.post("/api/grammar-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
    const { status, data } = await grammarexerciseService.completeGrammarExercise(req.user.id, req.params.id);
    return res.status(status).json(data);
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateGrammarExerciseInput(req.body);
    if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    const { status, data } = await grammarexerciseService.insertGrammarexercise(buildGrammarExerciseDataFromRequest(req.body));
    res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
    const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
    if (!exercise) {
        return res.status(404).json({ message: "Grammar Exercise not found" });
    }
    res.json(exercise);
}));

router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateGrammarExerciseInput(req.body);
    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: validation.errors.join(', ')
        });
    }
    const { status, data } = await grammarexerciseService.updateGrammarexercise(req.params.id, buildGrammarExerciseDataFromRequest(req.body));
    res.status(status).json(data);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const { status, data } = await grammarexerciseService.deleteGrammarexercise(req.params.id);
    return res.status(status).json(data);
}));

module.exports = router;
module.exports.setGrammarExerciseService = (service) => {
    grammarexerciseService = service;
};
