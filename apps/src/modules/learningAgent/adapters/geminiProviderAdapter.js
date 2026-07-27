class GeminiProviderAdapter {
    constructor(options = {}) {
        this.client = options.client || null;
        this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    }

    async createJsonCompletion({ task }) {
        if (this.client?.createJsonCompletion) {
            return await this.client.createJsonCompletion(...arguments);
        }
        if (task === "provider_health_check") {
            return this.buildJsonResponse({
                ok: true,
                message: "Gemini provider adapter skeleton is ready."
            });
        }
        throw this.createNotImplementedError("Gemini live adapter skeleton is registered, but real API calls are not implemented yet.");
    }

    buildJsonResponse(payload, usage = null) {
        return {
            choices: [
                {
                    message: {
                        content: JSON.stringify(payload)
                    }
                }
            ],
            usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    }

    createNotImplementedError(message) {
        const error = new Error(message);
        error.statusCode = 501;
        error.code = "AI_PROVIDER_NOT_IMPLEMENTED";
        return error;
    }
}

module.exports = GeminiProviderAdapter;
