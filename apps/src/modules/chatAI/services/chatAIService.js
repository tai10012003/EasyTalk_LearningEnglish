const OpenAIService = require('./openAIService');
const ConversationFlowService = require('./conversationFlowService');

class ChatAIService {
    constructor() {
        this.openAIService = new OpenAIService();
        this.conversationFlowService = new ConversationFlowService(this.openAIService);
    }

    async startConversation() {
        return await this.conversationFlowService.startConversation();
    }

    async continueConversation(message, step, sessionTopic) {
        return await this.conversationFlowService.continueConversation(message, step, sessionTopic);
    }
}

module.exports = ChatAIService;