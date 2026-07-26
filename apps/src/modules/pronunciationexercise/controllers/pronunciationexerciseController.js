const express = require("express");
const router = express.Router();
const multer = require('multer');
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const PronunciationExerciseService = require("../services/pronunciationexerciseService");
const { validatePronunciationExerciseInput, buildPronunciationExerciseDataFromRequest } = require("../validators/pronunciationexerciseValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

let pronunciationexerciseService = new PronunciationExerciseService();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/pronunciation-exercises", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({ success: true, data: pronunciationexercises, currentPage: page, totalPages });
}));

router.get("/api/pronunciation-exercises/:id", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationexerciseService.getPronunciationexerciseDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.get("/api/pronunciation-exercises/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseBySlug(req.params.slug);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }
        res.json(exercise);
}));

router.post('/analyze/:id/:index', verifyToken, upload.single('audio'), asyncHandler(async (req, res) => {
        const audioBuffer = req.file ? req.file.buffer : null;
        const questionIndex = parseInt(req.params.index, 10);
        const { status, data } = await pronunciationexerciseService.analyzePronunciation(audioBuffer, req.params.id, questionIndex, req.user.id);
        return res.status(status).json(data);
}));

router.post("/api/pronunciation-exercises/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationexerciseService.completePronunciationexercise(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { status, data } = await pronunciationexerciseService.insertPronunciationexercise(buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
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
        const { status, data } = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, buildPronunciationExerciseDataFromRequest(req.body));
        return res.status(status).json(data);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationexerciseService.deletePronunciationexercise(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;
module.exports.setPronunciationExerciseService = (service) => {
    pronunciationexerciseService = service;
};
