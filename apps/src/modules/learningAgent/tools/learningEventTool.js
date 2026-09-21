class LearningEventTool {
    constructor(deps = {}) {
        this.agentLearningEventService = deps.agentLearningEventService || null;
    }

    setAgentLearningEventService(service) {
        this.agentLearningEventService = service;
    }

    recordWritingAnalysis(userId, payload = {}) {
        if (!this.agentLearningEventService || !userId) return null;
        return this.agentLearningEventService.recordWritingAnalysis(userId, payload);
    }
}

module.exports = LearningEventTool;
