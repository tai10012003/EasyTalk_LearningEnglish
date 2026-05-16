const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const ChatAIService = require("../services/chatAIService");
const { validateChatMessage } = require("../validators/chatValidator");
const chatAIService = new ChatAIService();

router.get("/api/chat/start", verifyToken, async (req, res) => {
    try {
        const result = await chatAIService.startConversation();
        res.json(result);
    } catch (error) {
        console.error("ChatAI start error:", error);
        res.status(500).json({ error: error.message || "Error starting conversation" });
    }
});

router.post("/api/chat", verifyToken, async (req, res) => {
    try {
        const validation = validateChatMessage(req.body);
        if(!validation.valid) {
            return res.status(400).json({ error: validation.errors.join(', ') });
        }
        const { message, step, sessionTopic } = req.body;
        const result = await chatAIService.continueConversation(message, step, sessionTopic);
        res.json(result);
    } catch (error) {
        console.error("ChatAI conversation error:", error);
        res.status(500).json({ error: error.message || "Error processing request" });
    }
});

module.exports = router;