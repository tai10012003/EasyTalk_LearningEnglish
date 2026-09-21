const OpenAI = require("openai");
const { WRITING_ANALYSIS_PROMPT, GPT_CONFIG } = require('../utils/writingPrompts');
const { extractOverallScore } = require('../utils/scoreExtractor');

class WritingAnalyzerService {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    async analyzeWriting(userText, options = {}) {
        const modeConfig = options.modeConfig || null;
        try {
            const response = await this.openai.chat.completions.create({
                model: GPT_CONFIG.model,
                messages: [
                    {
                        role: "system",
                        content: this.buildWritingPrompt(modeConfig)
                    },
                    { 
                        role: "user", 
                        content: JSON.stringify({
                            mode: modeConfig ? {
                                key: modeConfig.key,
                                title: modeConfig.title,
                                correctionDepth: modeConfig.correctionDepth,
                                promptHints: modeConfig.promptHints,
                                skillFocus: modeConfig.skillFocus
                            } : null,
                            text: userText
                        })
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

    buildWritingPrompt(modeConfig = null) {
        if (!modeConfig) return WRITING_ANALYSIS_PROMPT;
        return [
            WRITING_ANALYSIS_PROMPT,
            "",
            "Agent writing mode:",
            `- Title: ${modeConfig.title}`,
            `- Correction depth: ${modeConfig.correctionDepth || "medium"}`,
            `- Skill focus: ${(modeConfig.skillFocus || []).join(", ")}`,
            "Use this mode to decide feedback depth and priority.",
            "Do not invent learner level, IELTS band, topic data, or achievements.",
            "If the mode has prompt hints, follow them:",
            ...(modeConfig.promptHints || []).map(hint => `- ${hint}`)
        ].join("\n");
    }
}

module.exports = WritingAnalyzerService;
