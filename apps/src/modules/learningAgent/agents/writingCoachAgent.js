const WritingAnalyzerService = require('../../writingAI/services/writingAnalyzerService');
const LearningEventTool = require('../tools/learningEventTool');

class WritingCoachAgent {
    constructor(deps = {}) {
        this.writingAnalyzer = deps.writingAnalyzer || new WritingAnalyzerService();
        this.agentModeService = deps.agentModeService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.learningEventTool = deps.learningEventTool || new LearningEventTool({
            agentLearningEventService: deps.agentLearningEventService
        });
    }

    async analyzeWriting(userText, userId = null, options = {}) {
        const modeConfig = this.agentModeService
            ? await this.agentModeService.getModeOrDefault(options.mode || 'quick_correction', 'writing', 'quick_correction')
            : null;
        const result = this.aiProviderService
            ? await this.aiProviderService.generateWritingFeedback({
                userId,
                text: userText,
                modeConfig
            })
            : await this.writingAnalyzer.analyzeWriting(userText, { modeConfig });
        const normalizedResult = this.normalizeWritingResult(result);

        if (userId) {
            const eventPromise = this.learningEventTool.recordWritingAnalysis(userId, {
                score: normalizedResult.score,
                feedback: normalizedResult.suggestions,
                textLength: userText.length,
                mode: modeConfig?.key || options.mode || null
            });
            if (eventPromise) {
                eventPromise.catch(error => {
                    console.error("Failed to record writing learning event:", error.message);
                });
            }
        }

        return {
            ...normalizedResult,
            mode: modeConfig
        };
    }

    normalizeWritingResult(result = {}) {
        if (result.summary || result.corrections || result.rubric) {
            return {
                ...result,
                suggestions: result.suggestions || this.buildSuggestionsText(result),
                score: result.score ?? "Không xác định"
            };
        }
        return result;
    }

    buildSuggestionsText(result = {}) {
        const sections = [];
        if (result.summary) sections.push(`Tổng quan: ${result.summary}`);
        if (Array.isArray(result.strengths) && result.strengths.length) {
            sections.push(`Điểm mạnh:\n${result.strengths.map(item => `- ${item}`).join("\n")}`);
        }
        if (Array.isArray(result.corrections) && result.corrections.length) {
            sections.push(`Lỗi cần sửa:\n${result.corrections.map(item => `- Lỗi: ${item.original}. Sửa: ${item.corrected}. ${item.explanation || ""}`).join("\n")}`);
        }
        if (result.rewriteSuggestion) sections.push(`Improved version:\n${result.rewriteSuggestion}`);
        if (result.score !== undefined && result.score !== null) sections.push(`Điểm tổng quan: ${result.score}/10`);
        return sections.join("\n\n");
    }
}

module.exports = WritingCoachAgent;
