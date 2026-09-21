const { CONVERSATION_STEPS, getNextStep } = require('../utils/conversationState');
const { selectRandomTopic } = require('../utils/topicSelector');
const { buildSystemPrompt, buildSuggestionPrompt } = require('../utils/promptBuilder');

class ConversationFlowService {
    constructor(openAIService) {
        this.openAIService = openAIService;
    }

    async startConversation() {
        const systemPrompt = buildSystemPrompt(CONVERSATION_STEPS.START);
        const gptResponse = await this.openAIService.generateResponse(systemPrompt);
        const suggestionPrompt = buildSuggestionPrompt(gptResponse);
        const suggestion = await this.openAIService.generateSuggestions(suggestionPrompt);
        return { response: gptResponse, suggestion, step: CONVERSATION_STEPS.ASK_NAME, topic: null };
    }

    async continueConversation(message, currentStep, sessionTopic = null) {
        let topic = sessionTopic;
        let nextStep = getNextStep(currentStep);
        if (currentStep === CONVERSATION_STEPS.ASK_LOCATION) {
            topic = selectRandomTopic();
        }
        const systemPrompt = buildSystemPrompt(currentStep, message, topic);
        const gptResponse = await this.openAIService.generateResponse(systemPrompt, message);
        const suggestionPrompt = buildSuggestionPrompt(gptResponse);
        const suggestion = await this.openAIService.generateSuggestions(suggestionPrompt);
        return { response: gptResponse, suggestion, step: nextStep, topic };
    }
}

module.exports = ConversationFlowService;