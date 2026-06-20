const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const PronunciationService = require("../services/pronunciationService");
const { validatePronunciationInput, buildPronunciationDataFromRequest } = require("../validators/pronunciationValidator");
const pronunciationService = new PronunciationService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/pronunciation-list", verifyToken, asyncHandler(async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const role = req.user.role || "user";
    const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit, "", role);
    const totalPages = Math.ceil(totalPronunciations / limit);
    res.json({ pronunciations, currentPage: page, totalPages });
}));

router.get("/api/pronunciation/:id", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationService.getPronunciationDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.get("/api/pronunciation/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const pronunciation = await pronunciationService.getPronunciationBySlug(req.params.slug);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json({ pronunciation });
}));

router.post("/api/pronunciation/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await pronunciationService.completePronunciation(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/api/add", verifyAdmin, upload.single("image"), asyncHandler(async function (req, res) {
        const validation = validatePronunciationInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await pronunciationService.insertPronunciation(buildPronunciationDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const pronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json(pronunciation);
}));

router.put("/api/update/:id", verifyAdmin, upload.single("image"), asyncHandler(async function (req, res) {
        const validation = validatePronunciationInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await pronunciationService.updatePronunciation(req.params.id, buildPronunciationDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
}));

router.delete("/api/pronunciation/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const { status, data } = await pronunciationService.deletePronunciation(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;