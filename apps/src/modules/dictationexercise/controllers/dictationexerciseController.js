const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validateDictationExerciseInput, buildDictationExerciseDataFromRequest } = require("../validators/dictationexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createDictationExerciseController({ dictationExerciseService }) {
    if (!dictationExerciseService) {
        throw new Error("createDictationExerciseController requires dictationExerciseService");
    }
    const router = express.Router();
    router.get("/api/dictation-exercises", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { dictationExercises, totalDictationExercises } = await dictationExerciseService.getDictationList(page, limit, role, lang);
        const totalPages = Math.ceil(totalDictationExercises / limit);
        res.json({
            success: true,
            dictationExercises,
            currentPage: page,
            totalPages,
        });
    }));
    router.get("/api/dictation-exercises/roadmap", verifyToken, asyncHandler(async (req, res) => {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await dictationExerciseService.getDictationExerciseRoadmap(req.user.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/dictationexercise/:id", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await dictationExerciseService.getDictationExerciseDetails(req.user.id, req.params.id, lang);
        return res.status(status).json(data);
    }));
    router.get("/api/dictationexercise/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await dictationExerciseService.getDictationExerciseDetailsBySlug(req.user.id, req.params.slug, lang);
        return res.status(status).json(data);
    }));
    router.post("/api/dictation-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await dictationExerciseService.completeDictationExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
    }));
    router.post("/add", verifyAdmin, asyncHandler(async function (req, res) {
        const validation = validateDictationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await dictationExerciseService.insertDictation(buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await dictationExerciseService.getDictation(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Dictation Exercise not found" });
        }
        res.json(exercise);
    }));
    router.put("/update/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const validation = validateDictationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await dictationExerciseService.updateDictation(req.params.id, buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const { status, data } = await dictationExerciseService.deleteDictation(req.params.id);
        return res.status(status).json(data);
    }));
    return router;
}

module.exports = { createDictationExerciseController };
