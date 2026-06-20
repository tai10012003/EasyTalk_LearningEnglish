const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const VocabularyExerciseService = require("../services/vocabularyexerciseService");
const { validateVocabularyExerciseInput, buildVocabularyExerciseDataFromRequest } = require("../validators/vocabularyexerciseValidator");
const vocabularyexerciseService = new VocabularyExerciseService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

router.get("/api/vocabulary-exercises", verifyToken, asyncHandler(async (req, res) => {
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
}));

router.get("/api/vocabulary-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await vocabularyexerciseService.getVocabularyExerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.get("/api/vocabulary-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const slug = req.params.slug;
        const exercise = await vocabularyexerciseService.getVocabularyexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary exercise not found" });
        }
        res.json(exercise);
}));

router.post("/api/vocabulary-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyexerciseService.completeVocabularyExercise(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await vocabularyexerciseService.insertVocabularyexercise(buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await vocabularyexerciseService.getVocabularyexerciseById(req.params.id);
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
        const { status, data } = await vocabularyexerciseService.updateVocabularyexercise(req.params.id, buildVocabularyExerciseDataFromRequest(req.body));
        res.status(status).json(data);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await vocabularyexerciseService.deleteVocabularyexercise(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;