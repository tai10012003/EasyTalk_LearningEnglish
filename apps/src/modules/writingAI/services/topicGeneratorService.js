const OpenAI = require("openai");
const { TOPIC_GENERATION_PROMPT, GPT_CONFIG } = require('../utils/writingPrompts');

class TopicGeneratorService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async generateRandomTopic() {
        try {
            const response = await this.openai.chat.completions.create({
                model: GPT_CONFIG.model,
                messages: [
                    {
                        role: "system",
                        content: TOPIC_GENERATION_PROMPT
                    }
                ],
                temperature: GPT_CONFIG.topicGeneration.temperature,
                max_tokens: GPT_CONFIG.topicGeneration.max_tokens,
            });
            const topic = response.choices[0].message.content.trim();
            return topic;
        } catch (error) {
            console.error("Error generating topic:", error);
            throw new Error("Không thể tạo đề bài.");
        }
    }
}

module.exports = TopicGeneratorService;