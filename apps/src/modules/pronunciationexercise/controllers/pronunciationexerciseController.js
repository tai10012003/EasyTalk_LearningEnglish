const express = require("express");
const multer = require('multer');
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validatePronunciationExerciseInput, buildPronunciationExerciseDataFromRequest } = require("../validators/pronunciationexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const storage = multer.memoryStorage();
const upload = multer({ storage });

function createPronunciationExerciseController({ pronunciationExerciseService }) {
    if (!pronunciationExerciseService) {
        throw new Error("createPronunciationExerciseController requires pronunciationExerciseService");
    }
    const router = express.Router();
    router.get("/api/pronunciation-exercises", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { pronunciationexercises, totalExercises } = await pronunciationExerciseService.getPronunciationexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({ success: true, data: pronunciationexercises, currentPage: page, totalPages });
    }));
    router.get("/api/pronunciation-exercises/roadmap", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationExerciseService.getPronunciationExerciseRoadmap(req.user.id);
        return res.status(status).json(data);
    }));
    router.get("/api/pronunciation-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationExerciseService.getPronunciationexerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.get("/api/pronunciation-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationExerciseService.getPronunciationexerciseDetailsBySlug(req.user.id, req.params.slug);
        return res.status(status).json(data);
    }));
    router.post('/analyze/:id/:index', verifyToken, upload.single('audio'), asyncHandler(async (req, res) => {
        const audioBuffer = req.file ? req.file.buffer : null;
        const questionIndex = parseInt(req.params.index, 10);
        const { status, data } = await pronunciationExerciseService.analyzePronunciation(audioBuffer, req.params.id, questionIndex, req.user.id);
        return res.status(status).json(data);
    }));
    router.post("/api/pronunciation-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.completePronunciationexercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.post("/api/pronunciation-exercises/:id/attempts", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.startAttempt(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/history", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, data } = await pronunciationExerciseService.getAttemptHistory(req.user.id, page, limit);
        return res.status(status).json(data);
    }));
    router.get("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.getAttemptDetail(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.delete("/api/attempts/:attemptId", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.deleteAttemptHistory(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/questions/:questionIndex/check", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.checkAttemptQuestion(
            req.user.id,
            req.params.attemptId,
            req.params.questionIndex,
            req.body.answer
        );
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/questions/:questionIndex/analyze", verifyToken, upload.single('audio'), asyncHandler(async (req, res) => {
        const audioBuffer = req.file ? req.file.buffer : null;
        const { status, data } = await pronunciationExerciseService.analyzeAttemptQuestion(
            audioBuffer,
            req.user.id,
            req.params.attemptId,
            req.params.questionIndex
        );
        return res.status(status).json(data);
    }));
    router.post("/api/attempts/:attemptId/finish", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.finishAttempt(req.user.id, req.params.attemptId);
        return res.status(status).json(data);
    }));
    router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await pronunciationExerciseService.insertPronunciationexercise(buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
    }));
    router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await pronunciationExerciseService.getPronunciationexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation Exercise not found" });
        }
        res.json(exercise);
    }));
    router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await pronunciationExerciseService.updatePronunciationexercise(req.params.id, buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationExerciseService.deletePronunciationexercise(req.params.id);
        return res.status(status).json(data);
    }));
    return router;
}

module.exports = { createPronunciationExerciseController };
