const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const ChatAIService = require("../services/chatAIService");
const { validateChatMessage } = require("../validators/chatValidator");
const chatAIService = new ChatAIService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

router.get("/api/chat/start", verifyToken, asyncHandler(async (req, res) => {
    const result = await chatAIService.startConversation();
    res.json(result);
}));

router.post("/api/chat", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateChatMessage(req.body);
    if(!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
    }
    const { message, step, sessionTopic } = req.body;
    const result = await chatAIService.continueConversation(message, step, sessionTopic);
    res.json(result);
}));

module.exports = router;