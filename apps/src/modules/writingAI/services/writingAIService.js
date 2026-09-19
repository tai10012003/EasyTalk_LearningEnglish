class WritingAIService {
    constructor(deps = {}) {
        if (!deps.topicGenerator) {
            throw new Error("WritingAIService requires topicGenerator");
        }
        if (!deps.writingAnalyzer) {
            throw new Error("WritingAIService requires writingAnalyzer");
        }
        if (!deps.writingCoachAgent) {
            throw new Error("WritingAIService requires writingCoachAgent");
        }
        this.topicGenerator = deps.topicGenerator;
        this.writingAnalyzer = deps.writingAnalyzer;
        this.agentLearningEventService = deps.agentLearningEventService || null;
        this.agentModeService = deps.agentModeService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.writingCoachAgent = deps.writingCoachAgent;
    }

    async generateRandomTopic() {
        return await this.topicGenerator.generateRandomTopic();
    }

    async analyzeWriting(userText, userId = null, options = {}) {
        return await this.writingCoachAgent.analyzeWriting(userText, userId, options);
    }

    normalizeWritingResult(result = {}) {
        return this.writingCoachAgent.normalizeWritingResult(result);
    }

    buildSuggestionsText(result = {}) {
        return this.writingCoachAgent.buildSuggestionsText(result);
    }
}

module.exports = WritingAIService;
