const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validateVocabularyExerciseInput, buildVocabularyExerciseDataFromRequest } = require("../validators/vocabularyexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createVocabularyExerciseController({ vocabularyExerciseService }) {
    if (!vocabularyExerciseService) {
        throw new Error("createVocabularyExerciseController requires vocabularyExerciseService");
    }
    const router = express.Router();
    router.get("/api/vocabulary-exercises", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { vocabularyexercises, totalExercises } = await vocabularyExerciseService.getVocabularyexerciseList(page, limit, role, lang);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
            success: true,
            data: vocabularyexercises,
            currentPage: page,
            totalPages,
        });
    }));
    router.get("/api/vocabulary-exercises/roadmap", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await vocabularyExerciseService.getVocabularyExerciseRoadmap(req.user.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/vocabulary-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await vocabularyExerciseService.getVocabularyExerciseDetails(req.user.id, req.params.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/vocabulary-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const slug = req.params.slug;
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await vocabularyExerciseService.getVocabularyExerciseDetailsBySlug(req.user.id, slug, lang);
        return res.status(status).json(data);
    }));
    router.post("/api/vocabulary-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.completeVocabularyExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.post("/api/vocabulary-exercises/:id/attempts", verifyToken, asyncHandler(async (req, res) => {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await vocabularyExerciseService.startAttempt(req.user.id, req.params.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/history", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, data } = await vocabularyExerciseService.getAttemptHistory(req.user.id, page, limit);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.getAttemptDetail(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.delete("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.deleteAttemptHistory(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/questions/:questionIndex/check", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.checkAttemptQuestion(
            req.user.id,
            req.params.attemptId,
            req.params.questionIndex,
            req.body.answer
        );
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/finish", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.finishAttempt(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await vocabularyExerciseService.insertVocabularyexercise(buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await vocabularyExerciseService.getVocabularyexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary Exercise not found" });
        }
        res.json(exercise);
    }));
    router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }
        const { status, data } = await vocabularyExerciseService.updateVocabularyexercise(req.params.id, buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyExerciseService.deleteVocabularyexercise(req.params.id);
        return res.status(status).json(data);
    }));
    return router;
}

module.exports = { createVocabularyExerciseController };
