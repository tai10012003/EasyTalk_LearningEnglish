const TopicGeneratorService = require('./topicGeneratorService');
const WritingAnalyzerService = require('./writingAnalyzerService');

class WritingAIService {
    constructor(deps = {}) {
        this.topicGenerator = deps.topicGenerator || new TopicGeneratorService();
        this.writingAnalyzer = deps.writingAnalyzer || new WritingAnalyzerService();
    }

    async generateRandomTopic() {
        return await this.topicGenerator.generateRandomTopic();
    }

    async analyzeWriting(userText) {
        return await this.writingAnalyzer.analyzeWriting(userText);
    }
}

module.exports = WritingAIService;