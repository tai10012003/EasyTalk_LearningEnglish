class ChatAIService {
    constructor(deps = {}) {
        if (!deps.openAIService) {
            throw new Error("ChatAIService requires openAIService");
        }
        if (!deps.conversationFlowService) {
            throw new Error("ChatAIService requires conversationFlowService");
        }
        this.openAIService = deps.openAIService;
        this.conversationFlowService = deps.conversationFlowService;
    }

    async startConversation() {
        return await this.conversationFlowService.startConversation();
    }

    async continueConversation(message, step, sessionTopic) {
        return await this.conversationFlowService.continueConversation(message, step, sessionTopic);
    }
}

module.exports = ChatAIService;
