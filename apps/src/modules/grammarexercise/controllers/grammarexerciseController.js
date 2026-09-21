const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validateGrammarExerciseInput, buildGrammarExerciseDataFromRequest } = require("../validators/grammarexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createGrammarExerciseController({ grammarExerciseService }) {
    if (!grammarExerciseService) {
        throw new Error("createGrammarExerciseController requires grammarExerciseService");
    }
    const router = express.Router();
    router.get("/api/grammar-exercises", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { grammarexercises, totalExercises } = await grammarExerciseService.getGrammarexerciseList(page, limit, role, lang);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
            success: true,
            data: grammarexercises,
            currentPage: page,
            totalPages,
        });
    }));
    router.get("/api/grammar-exercises/roadmap", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarExerciseService.getGrammarExerciseRoadmap(req.user.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/grammar-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarExerciseService.getGrammarExerciseDetails(req.user.id, req.params.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/grammar-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const slug = req.params.slug;
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarExerciseService.getGrammarExerciseDetailsBySlug(req.user.id, slug, lang);
        return res.status(status).json(data);
    }));
    router.post("/api/grammar-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.completeGrammarExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.post("/api/grammar-exercises/:id/attempts", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.startAttempt(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/history", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, data } = await grammarExerciseService.getAttemptHistory(req.user.id, page, limit);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.getAttemptDetail(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.delete("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.deleteAttemptHistory(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/questions/:questionIndex/check", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.checkAttemptQuestion(
            req.user.id,
            req.params.attemptId,
            req.params.questionIndex,
            req.body.answer
        );
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/finish", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.finishAttempt(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateGrammarExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await grammarExerciseService.insertGrammarexercise(buildGrammarExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await grammarExerciseService.getGrammarexerciseById(req.params.id);
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
        const { status, data } = await grammarExerciseService.updateGrammarexercise(req.params.id, buildGrammarExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await grammarExerciseService.deleteGrammarexercise(req.params.id);
        return res.status(status).json(data);
    }));
    return router;
}

module.exports = { createGrammarExerciseController };
