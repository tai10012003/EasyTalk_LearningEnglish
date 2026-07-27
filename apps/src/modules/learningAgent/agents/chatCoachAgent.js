const MemoryTool = require('../tools/memoryTool');
const DailyPlanTool = require('../tools/dailyPlanTool');

class ChatCoachAgent {
    constructor(deps = {}) {
        this.memoryTool = deps.memoryTool || new MemoryTool({ learnerMemoryService: deps.learnerMemoryService });
        this.dailyPlanTool = deps.dailyPlanTool || new DailyPlanTool({ learningAgentService: deps.learningAgentService });
        this.aiProviderService = deps.aiProviderService || null;
    }

    setAIProviderService(service) {
        this.aiProviderService = service;
    }

    setLearnerMemoryService(service) {
        this.memoryTool.setLearnerMemoryService(service);
    }

    setLearningAgentService(service) {
        this.dailyPlanTool.setLearningAgentService(service);
    }

    async createOpeningReply(userId, session, modeConfig = null) {
        const [memory, dailyPlan] = await Promise.all([
            this.memoryTool.getOrCreateMemory(userId),
            this.dailyPlanTool.getDailyPlan(userId, { targetMinutes: 12 })
        ]);
        const greeting = await this.aiProviderService.generateAgentChatReply({
            userId,
            message: '',
            session,
            modeConfig,
            memory,
            dailyPlan,
            history: [],
            isFirstTurn: true
        });

        return {
            reply: greeting.reply,
            suggestions: greeting.suggestions || [],
            memorySnapshot: memory,
            dailyPlan
        };
    }

    async replyToMessage(userId, session, message) {
        const memory = await this.memoryTool.getOrCreateMemory(userId);
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

        return {
            reply: response.reply,
            corrections: response.corrections || [],
            suggestions: response.suggestions || []
        };
    }

    async summarizeSession(userId, session) {
        const memory = await this.memoryTool.getOrCreateMemory(userId);
        const summary = await this.aiProviderService.summarizeAgentChat({
            userId,
            session,
            modeConfig: session.modeConfigSnapshot || null,
            memory
        });
        await this.memoryTool.applySessionInsights(userId, summary, {
            evidenceWeight: 3
        });
        return summary;
    }
}

module.exports = ChatCoachAgent;
