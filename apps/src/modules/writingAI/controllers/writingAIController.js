const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const WritingAIService = require("../services/writingAIService");
const { validateWritingText } = require("../validators/writingValidator");
let writingAIService = null;
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function getWritingAIService() {
    if (!writingAIService) {
        writingAIService = new WritingAIService();
    }
    return writingAIService;
}

router.get("/api/writing/random-topic", verifyToken, asyncHandler(async (req, res) => {
    const topic = await getWritingAIService().generateRandomTopic();
    res.json({ topic });
}));

router.post("/api/analyze", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateWritingText(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
    }
    const userText = req.body.text;
    const result = await getWritingAIService().analyzeWriting(userText);
    res.json(result);
}));

module.exports = router;
module.exports.setWritingAIService = (service) => {
    writingAIService = service;
};