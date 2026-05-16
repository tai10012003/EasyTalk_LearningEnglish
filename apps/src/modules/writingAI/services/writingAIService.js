const TopicGeneratorService = require('./topicGeneratorService');
const WritingAnalyzerService = require('./writingAnalyzerService');

class WritingAIService {
    constructor() {
        this.topicGenerator = new TopicGeneratorService();
        this.writingAnalyzer = new WritingAnalyzerService();
    }

    async generateRandomTopic() {
        return await this.topicGenerator.generateRandomTopic();
    }

    async analyzeWriting(userText) {
        return await this.writingAnalyzer.analyzeWriting(userText);
    }
}

module.exports = WritingAIService;