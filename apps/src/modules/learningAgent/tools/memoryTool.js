class MemoryTool {
    constructor(deps = {}) {
        this.learnerMemoryService = deps.learnerMemoryService || null;
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
    }

    async getOrCreateMemory(userId) {
        if (!this.learnerMemoryService) return null;
        return await this.learnerMemoryService.getOrCreateMemory(userId);
    }

    async applySessionInsights(userId, insights, context = {}) {
        if (!this.learnerMemoryService) return null;
        return await this.learnerMemoryService.applySessionInsights(userId, insights, context);
    }
}

module.exports = MemoryTool;
