const { createWritingAIController } = require('./controllers/writingAIController');
const WritingAIService = require('./services/writingAIService');
const TopicGeneratorService = require('./services/topicGeneratorService');
const WritingAnalyzerService = require('./services/writingAnalyzerService');

module.exports = {
    createWritingAIController,
    WritingAIService,
    TopicGeneratorService,
    WritingAnalyzerService
};
