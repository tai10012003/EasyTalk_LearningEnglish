const AgentSession = require('../models/agentSession');
const AgentSessionRepository = require('../repositories/agentSessionRepository');

class AgentSessionService {
    constructor(deps = {}) {
        this.repository = deps.repository || new AgentSessionRepository();
        this.learnerMemoryService = deps.learnerMemoryService || null;
        this.learningAgentService = deps.learningAgentService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.agentModeService = deps.agentModeService || null;
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
    }

    setLearningAgentService(service) {
        this.learningAgentService = service;
    }

    setAIProviderService(service) {
        this.aiProviderService = service;
    }

    setAgentModeService(service) {
        this.agentModeService = service;
    }

    async startChatSession(userId, data = {}) {
        const memory = this.learnerMemoryService
            ? await this.learnerMemoryService.getOrCreateMemory(userId)
            : null;
        const modeConfig = this.agentModeService
            ? await this.agentModeService.getModeOrDefault(data.mode || 'speaking_practice', 'chat', 'speaking_practice')
            : null;
        const session = AgentSession.buildChatDocument(userId, {
            ...data,
            mode: modeConfig?.key || data.mode || 'speaking_practice',
            modeConfigSnapshot: modeConfig
        });
        const insertedId = await this.repository.insert(session);
        const dailyPlan = this.learningAgentService
            ? await this.learningAgentService.getDailyPlan(userId, { targetMinutes: 12 })
            : null;
        const greeting = await this.aiProviderService.generateAgentChatReply({
            userId,
            message: '',
            session: { ...session, _id: insertedId },
            modeConfig,
            memory,
            dailyPlan,
            history: [],
            isFirstTurn: true
        });
        const botMessage = AgentSession.buildMessage('assistant', greeting.reply, {
            suggestions: greeting.suggestions || []
        });
        await this.repository.pushMessages(insertedId, [botMessage]);

        return {
            sessionId: insertedId,
            reply: greeting.reply,
            suggestions: greeting.suggestions || [],
            mode: session.mode,
            modeConfig,
            topic: session.topic,
            memorySnapshot: memory,
            dailyPlan
        };
    }

    async sendChatMessage(userId, sessionId, message) {
        const session = await this.repository.findByIdForUser(sessionId, userId);
        if (!session) {
            const error = new Error("Không tìm thấy Agent session.");
            error.statusCode = 404;
            error.code = "AGENT_SESSION_NOT_FOUND";
            throw error;
        }
        if (session.status !== 'active') {
            const error = new Error("Agent session đã kết thúc.");
            error.statusCode = 409;
            error.code = "AGENT_SESSION_COMPLETED";
            throw error;
        }

        const memory = this.learnerMemoryService
            ? await this.learnerMemoryService.getOrCreateMemory(userId)
            : null;
        const userMessage = AgentSession.buildMessage('user', message);
        const response = await this.aiProviderService.generateAgentChatReply({
            userId,
            message,
            session,
            modeConfig: session.modeConfigSnapshot || null,
            memory,
            dailyPlan: null,
            history: session.messages || [],
            isFirstTurn: false
        });
        const assistantMessage = AgentSession.buildMessage('assistant', response.reply, {
            corrections: response.corrections || [],
            suggestions: response.suggestions || []
        });
        await this.repository.pushMessages(sessionId, [userMessage, assistantMessage]);

        return {
            sessionId,
            reply: response.reply,
            corrections: response.corrections || [],
            suggestions: response.suggestions || []
        };
    }

    async finishChatSession(userId, sessionId) {
        const session = await this.repository.findByIdForUser(sessionId, userId);
        if (!session) {
            const error = new Error("Không tìm thấy Agent session.");
            error.statusCode = 404;
            error.code = "AGENT_SESSION_NOT_FOUND";
            throw error;
        }

        const memory = this.learnerMemoryService
            ? await this.learnerMemoryService.getOrCreateMemory(userId)
            : null;
        const summary = await this.aiProviderService.summarizeAgentChat({
            userId,
            session,
            modeConfig: session.modeConfigSnapshot || null,
            memory
        });
        await this.repository.completeSession(sessionId, summary);
        if (this.learnerMemoryService) {
            await this.learnerMemoryService.applySessionInsights(userId, summary, {
                evidenceWeight: 3
            });
        }

        return {
            sessionId,
            ...summary
        };
    }
}

module.exports = AgentSessionService;
