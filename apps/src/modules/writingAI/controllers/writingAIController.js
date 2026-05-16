const express = require("express");
const router = express.Router();
const WritingAIService = require("../services/writingAIService");
const { validateWritingText } = require("../validators/writingValidator");
const writingAIService = new WritingAIService();

router.get("/api/writing/random-topic", async (req, res) => {
    try {
        const topic = await writingAIService.generateRandomTopic();
        res.json({ topic });
    } catch (error) {
        console.error("Error generating topic:", error);
        res.status(500).json({ error: error.message || "Không thể tạo đề bài." });
    }
});

router.post("/api/analyze", async (req, res) => {
    try {
        const validation = validateWritingText(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        const userText = req.body.text;
        const result = await writingAIService.analyzeWriting(userText);
        res.json(result);
    } catch (error) {
        console.error("Error analyzing writing:", error);
        res.status(500).json({ error: error.message || "Có lỗi xảy ra. Vui lòng thử lại sau." });
    }
});

module.exports = router;