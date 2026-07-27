class DailyPlanTool {
    constructor(deps = {}) {
        this.learningAgentService = deps.learningAgentService || null;
    }

    setLearningAgentService(service) {
        this.learningAgentService = service;
    }

    async getDailyPlan(userId, options = {}) {
        if (!this.learningAgentService) return null;
        return await this.learningAgentService.getDailyPlan(userId, options);
    }
}

module.exports = DailyPlanTool;
