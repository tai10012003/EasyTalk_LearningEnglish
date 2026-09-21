const express = require("express");
const { verifyToken } = require("../../../shared/middleware/verifyToken");
const { validateChatMessage } = require("../validators/chatValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createChatAIController({ chatAIService }) {
    if (!chatAIService) {
        throw new Error("createChatAIController requires chatAIService");
    }
    const router = express.Router();

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
    return router;
}

module.exports = { createChatAIController };
