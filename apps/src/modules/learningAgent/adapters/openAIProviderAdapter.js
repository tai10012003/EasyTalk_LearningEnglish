class OpenAIProviderAdapter {
    constructor(options = {}) {
        this.client = options.client || null;
        this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    }

    async createJsonCompletion({ model, messages, temperature, maxTokens }) {
        const client = this.getClient();
        return await client.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            response_format: { type: "json_object" }
        });
    }

    getClient() {
        if (this.client) return this.client;
        if (!this.apiKey) {
            const error = new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai and AI_PROVIDER_MODE=live.");
            error.statusCode = 500;
            error.code = "OPENAI_API_KEY_MISSING";
            throw error;
        }
        const OpenAI = require("openai");
        this.client = new OpenAI({ apiKey: this.apiKey });
        return this.client;
    }
}

module.exports = OpenAIProviderAdapter;
