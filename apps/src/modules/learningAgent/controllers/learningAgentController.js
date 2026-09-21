const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");
const { validateDailyPlanQuery, validateModesQuery, validateStartChat, validateChatMessage } = require("../validators/learningAgentValidator");

function createLearningAgentController({
    learningAgentService,
    learnerMemoryService,
    aiProviderService,
    aiUsageService,
    agentSessionService,
    agentLearningEventService,
    agentModeService,
    aiTextToSpeechService,
    aiProviderDebugService,
    studyGuideAgent
}) {
    const required = {
        learningAgentService,
        learnerMemoryService,
        aiProviderService,
        aiUsageService,
        agentSessionService,
        agentLearningEventService,
        agentModeService,
        aiTextToSpeechService,
        aiProviderDebugService,
        studyGuideAgent
    };
    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([name]) => name);
    if (missing.length) {
        throw new Error(`createLearningAgentController requires: ${missing.join(', ')}`);
    }
    const router = express.Router();
    router.get("/daily-plan", verifyToken, asyncHandler(async (req, res) => {
        const options = validateDailyPlanQuery(req.query);
        const plan = await learningAgentService.getDailyPlan(req.user.id, options);
        res.json(plan);
    }));
    router.get("/guide/coach", verifyToken, asyncHandler(async (req, res) => {
        const options = validateDailyPlanQuery(req.query);
        const guide = await studyGuideAgent.buildCoachGuide(req.user.id, options);
        res.json(guide);
    }));
    router.get("/memory", verifyToken, asyncHandler(async (req, res) => {
        const memory = await learnerMemoryService.getOrCreateMemory(req.user.id);
        res.json(memory);
    }));
    router.put("/memory", verifyToken, asyncHandler(async (req, res) => {
        const memory = await learnerMemoryService.updateMemory(req.user.id, req.body);
        res.json({ message: "Cập nhật learner memory thành công", memory });
    }));
    router.put("/memory/study-preferences", verifyToken, asyncHandler(async (req, res) => {
        const memory = await learnerMemoryService.updateStudyPreferences(req.user.id, {
            targetStudyMinutes: req.body?.targetStudyMinutes
        });
        res.json({ message: "Cập nhật thời gian học thành công", memory });
    }));
    router.get("/memory/options", verifyToken, asyncHandler(async (req, res) => {
        res.json(learnerMemoryService.getAllowedValues());
    }));
    router.get("/provider/status", verifyToken, asyncHandler(async (req, res) => {
        res.json(aiProviderService.getStatus());
    }));
    router.get("/provider/debug", verifyAdmin, asyncHandler(async (req, res) => {
        const debug = await aiProviderDebugService.getDebugSnapshot({
            recentLimit: req.query.limit
        });
        res.json(debug);
    }));
    router.post("/provider/test", verifyToken, asyncHandler(async (req, res) => {
        const result = await aiProviderService.testProvider(req.user.id);
        res.json(result);
    }));
    router.post("/tts", verifyToken, asyncHandler(async (req, res) => {
        const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
        if (!text) {
            return res.status(400).json({ success: false, message: "Thiếu nội dung cần đọc." });
        }
        if (text.length > 1200) {
            return res.status(400).json({ success: false, message: "Nội dung đọc tối đa 1200 ký tự." });
        }
        const result = await aiTextToSpeechService.synthesize({
            userId: req.user.id,
            text
        });
        res.setHeader("Content-Type", result.contentType);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-AI-TTS-Provider", result.metadata.provider);
        res.setHeader("X-AI-TTS-Model", result.metadata.model);
        res.send(result.audioBuffer);
    }));
    router.get("/usage/today", verifyToken, asyncHandler(async (req, res) => {
        const summary = await aiUsageService.getTodaySummary(req.user.id);
        res.json(summary);
    }));
    router.get("/modes", verifyToken, asyncHandler(async (req, res) => {
        const validation = validateModesQuery(req.query);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const memory = learnerMemoryService ? await learnerMemoryService.getOrCreateMemory(req.user.id) : null;
        const modes = await agentModeService.listModes({
            activityType: validation.activityType,
            memory,
            lang: req.query.lang === "en" ? "en" : "vi"
        });
        res.json({ modes });
    }));
    router.post("/chat/start", verifyToken, asyncHandler(async (req, res) => {
        const validation = validateStartChat(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const result = await agentSessionService.startChatSession(req.user.id, req.body);
        res.json(result);
    }));
    router.post("/chat/message", verifyToken, asyncHandler(async (req, res) => {
        const validation = validateChatMessage(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const result = await agentSessionService.sendChatMessage(req.user.id, req.body.sessionId, req.body.message.trim());
        res.json(result);
    }));
    router.post("/chat/:sessionId/finish", verifyToken, asyncHandler(async (req, res) => {
        const result = await agentSessionService.finishChatSession(req.user.id, req.params.sessionId);
        res.json(result);
    }));
    router.get("/learning-events/recent", verifyToken, asyncHandler(async (req, res) => {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const events = await agentLearningEventService.getRecentEvents(req.user.id, limit);
        res.json({ events });
    }));
    return router;
}

module.exports = { createLearningAgentController };
