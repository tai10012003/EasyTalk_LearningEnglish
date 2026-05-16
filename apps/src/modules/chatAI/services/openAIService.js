const OpenAI = require("openai");

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.model = "gpt-3.5-turbo";
    }

    async generateChatCompletion(systemPrompt, userMessage = null) {
        try {
            const messages = [{ role: "system", content: systemPrompt }];
            if(userMessage) {
                messages.push({ role: "user", content: userMessage });
            }
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error("OpenAI API error:", error.response ? error.response.data : error.message);
            throw new Error("Error communicating with OpenAI API");
        }
    }

    async generateResponse(systemPrompt, userMessage) {
        return await this.generateChatCompletion(systemPrompt, userMessage);
    }

    async generateSuggestions(suggestionPrompt) {
        return await this.generateChatCompletion(suggestionPrompt);
    }
}

module.exports = OpenAIService;