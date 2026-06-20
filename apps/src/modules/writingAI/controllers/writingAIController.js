const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const WritingAIService = require("../services/writingAIService");
const { validateWritingText } = require("../validators/writingValidator");
const writingAIService = new WritingAIService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

router.get("/api/writing/random-topic", verifyToken, asyncHandler(async (req, res) => {
    const topic = await writingAIService.generateRandomTopic();
    res.json({ topic });
}));

router.post("/api/analyze", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateWritingText(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
    }
    const userText = req.body.text;
    const result = await writingAIService.analyzeWriting(userText);
    res.json(result);
}));

module.exports = router;