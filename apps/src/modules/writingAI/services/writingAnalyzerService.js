const OpenAI = require("openai");
const { WRITING_ANALYSIS_PROMPT, GPT_CONFIG } = require('../utils/writingPrompts');
const { extractOverallScore } = require('../utils/scoreExtractor');

class WritingAnalyzerService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async analyzeWriting(userText) {
        try {
            const response = await this.openai.chat.completions.create({
                model: GPT_CONFIG.model,
                messages: [
                    {
                        role: "system",
                        content: WRITING_ANALYSIS_PROMPT
                    },
                    { 
                        role: "user", 
                        content: userText 
                    },
                ],
                temperature: GPT_CONFIG.writingAnalysis.temperature,
                max_tokens: GPT_CONFIG.writingAnalysis.max_tokens,
            });
            const aiFeedback = response.choices[0].message.content;
            const overallScore = extractOverallScore(aiFeedback);
            return { suggestions: aiFeedback, score: overallScore };
        } catch (error) {
            console.error("Error with OpenAI API:", error);
            throw new Error("Có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    }
}

module.exports = WritingAnalyzerService;