const TopicGeneratorService = require('./topicGeneratorService');
const WritingAnalyzerService = require('./writingAnalyzerService');
const WritingCoachAgent = require('../../learningAgent/agents/writingCoachAgent');

class WritingAIService {
    constructor(deps = {}) {
        this.topicGenerator = deps.topicGenerator || new TopicGeneratorService();
        this.writingAnalyzer = deps.writingAnalyzer || new WritingAnalyzerService();
        this.agentLearningEventService = deps.agentLearningEventService || null;
        this.agentModeService = deps.agentModeService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.writingCoachAgent = deps.writingCoachAgent || new WritingCoachAgent({
            writingAnalyzer: this.writingAnalyzer,
            agentLearningEventService: this.agentLearningEventService,
            agentModeService: this.agentModeService,
            aiProviderService: this.aiProviderService
        });
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
