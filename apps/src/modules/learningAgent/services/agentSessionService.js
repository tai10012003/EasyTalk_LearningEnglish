const AgentSession = require('../models/agentSession');
const AgentSessionRepository = require('../repositories/agentSessionRepository');
const ChatCoachAgent = require('../agents/chatCoachAgent');

class AgentSessionService {
    constructor(deps = {}) {
        this.repository = deps.repository || new AgentSessionRepository();
        this.learnerMemoryService = deps.learnerMemoryService || null;
        this.learningAgentService = deps.learningAgentService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.agentModeService = deps.agentModeService || null;
        this.chatCoachAgent = deps.chatCoachAgent || new ChatCoachAgent({
            learnerMemoryService: this.learnerMemoryService,
            learningAgentService: this.learningAgentService,
            aiProviderService: this.aiProviderService
        });
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
        this.chatCoachAgent.setLearnerMemoryService(service);
    }

    setLearningAgentService(service) {
        this.learningAgentService = service;
        this.chatCoachAgent.setLearningAgentService(service);
    }

    setAIProviderService(service) {
        this.aiProviderService = service;
        this.chatCoachAgent.setAIProviderService(service);
    }

    setAgentModeService(service) {
        this.agentModeService = service;
    }

    async startChatSession(userId, data = {}) {
        const modeConfig = this.agentModeService
            ? await this.agentModeService.getModeOrDefault(data.mode || 'speaking_practice', 'chat', 'speaking_practice')
            : null;
        const session = AgentSession.buildChatDocument(userId, {
            ...data,
            mode: modeConfig?.key || data.mode || 'speaking_practice',
            modeConfigSnapshot: modeConfig
        });
        const insertedId = await this.repository.insert(session);
        const greeting = await this.chatCoachAgent.createOpeningReply(userId, { ...session, _id: insertedId }, modeConfig);
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
            memorySnapshot: greeting.memorySnapshot,
            dailyPlan: greeting.dailyPlan
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

        const userMessage = AgentSession.buildMessage('user', message);
        const response = await this.chatCoachAgent.replyToMessage(userId, session, message);
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

        const summary = await this.chatCoachAgent.summarizeSession(userId, session);
        await this.repository.completeSession(sessionId, summary);

        return {
            sessionId,
            ...summary
        };
    }
}

module.exports = AgentSessionService;
