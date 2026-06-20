const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const DictationExerciseService = require("../../dictationexercise/services/dictationexerciseService");
const { validateDictationExerciseInput, buildDictationExerciseDataFromRequest } = require("../validators/dictationexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const dictationexerciseService = new DictationExerciseService();

router.get("/api/dictation-exercises", verifyToken, asyncHandler(async (req, res) => {
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
}));

router.get("/api/dictationexercise/:id", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await dictationexerciseService.getDictationExerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.get("/api/dictationexercise/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const dictationExercise = await dictationexerciseService.getDictationBySlug(req.params.slug);
        if (!dictationExercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }
        res.json({ success: true, data: dictationExercise });
}));

router.post("/api/dictation-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await dictationexerciseService.completeDictationExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/add", verifyAdmin, asyncHandler(async function (req, res) {
        const validation = validateDictationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await dictationexerciseService.insertDictation(buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await dictationexerciseService.getDictation(req.params.id);
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
        const { status, data } = await dictationexerciseService.updateDictation(req.params.id, buildDictationExerciseDataFromRequest(req.body));
        res.status(status).json(data);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const { status, data } = await dictationexerciseService.deleteDictation(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;