const express = require("express");
const { verifyToken } = require("../../../shared/middleware/verifyToken");
const { validateWritingText } = require("../validators/writingValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createWritingAIController({ writingAIService }) {
    if (!writingAIService) {
        throw new Error("createWritingAIController requires writingAIService");
    }
    const router = express.Router();
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
        const result = await writingAIService.analyzeWriting(userText, req.user.id, {
            mode: req.body.mode
        });
        res.json(result);
    }));
    return router;
}

module.exports = { createWritingAIController };
