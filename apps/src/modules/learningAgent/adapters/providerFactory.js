const ProviderRegistry = require('./providerRegistry');
const OpenAIProviderAdapter = require('./openAIProviderAdapter');
const GeminiProviderAdapter = require('./geminiProviderAdapter');
const ClaudeProviderAdapter = require('./claudeProviderAdapter');

class ProviderFactory {
    static createRegistry(options = {}) {
        return new ProviderRegistry({
            openai: options.openAIProviderAdapter || new OpenAIProviderAdapter({
                client: options.openAIClient,
                apiKey: options.openAIApiKey
            }),
            gemini: options.geminiProviderAdapter || new GeminiProviderAdapter({
                client: options.geminiClient,
                apiKey: options.geminiApiKey
            }),
            claude: options.claudeProviderAdapter || new ClaudeProviderAdapter({
                client: options.claudeClient,
                apiKey: options.claudeApiKey
            })
        });
    }
}

module.exports = ProviderFactory;
