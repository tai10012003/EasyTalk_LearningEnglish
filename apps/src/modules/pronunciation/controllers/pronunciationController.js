const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require('../../../shared/middleware/cacheMiddleware');
const PronunciationService = require("../services/pronunciationService");
const { validatePronunciationInput, buildPronunciationDataFromRequest } = require("../validators/pronunciationValidator");
const pronunciationService = new PronunciationService();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/pronunciation-list", verifyToken, cacheMiddleware(300), async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    try {
        const role = req.user.role || "user";
        const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit, "", role);
        const totalPages = Math.ceil(totalPronunciations / limit);
        res.json({ pronunciations, currentPage: page, totalPages });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciations", error: err });
    }
});

router.get("/api/pronunciation/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await pronunciationService.getPronunciationDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciation details", error: err.message });
    }
});

router.get("/api/pronunciation/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const pronunciation = await pronunciationService.getPronunciationBySlug(req.params.slug);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json({ pronunciation });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciation details", error: err.message });
    }
});

router.post("/api/pronunciation/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await pronunciationService.completePronunciation(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing pronunciation:", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/api/add", upload.single("image"), async function (req, res) {
    try {
        const validation = validatePronunciationInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await pronunciationService.insertPronunciation(buildPronunciationDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Add pronunciation error:", error);
        res.status(500).json({ message: "Error adding pronunciation", error: error.message });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const pronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json(pronunciation);
    } catch (err) {
        console.error("Error fetching pronunciation:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    try {
        const validation = validatePronunciationInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await pronunciationService.updatePronunciation(req.params.id, buildPronunciationDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Update pronunciation error:", error);
        res.status(500).json({ message: "Error updating pronunciation", error: error.message });
    }
});

router.delete("/api/pronunciation/:id", async function (req, res) {
    try {
        const { status, data } = await pronunciationService.deletePronunciation(req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Delete pronunciation error:", error);
        res.status(500).json({ message: "Error deleting pronunciation", error: error.message });
    }
});

module.exports = router;