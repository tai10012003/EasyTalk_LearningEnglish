const dailyPlanSchema = require('./dailyPlan.schema');
const chatReplySchema = require('./chatReply.schema');
const chatSummarySchema = require('./chatSummary.schema');
const writingFeedbackSchema = require('./writingFeedback.schema');

class AIResponseSchemaGuard {
    validateTaskOutput(task, output = {}, input = {}) {
        if (!output || typeof output !== "object" || Array.isArray(output)) {
            throw this.createInvalidAIResponseError("AI provider returned a non-object JSON response.");
        }
        if (task === "enhance_daily_plan") {
            return this.validateDailyPlanEnhancement(output, input);
        }
        if (task === "provider_health_check") {
            return {
                ok: Boolean(output.ok),
                message: this.sanitizeString(output.message, "Provider responded.", 180)
            };
        }
        if (task === "agent_chat_reply") {
            return this.validateAgentChatReply(output);
        }
        if (task === "agent_chat_summary") {
            return this.validateAgentChatSummary(output, input);
        }
        if (task === "writing_feedback") {
            return this.validateWritingFeedback(output, input);
        }
        return output;
    }

    validateDailyPlanEnhancement(output, originalPlan = {}) {
        const originalTasks = Array.isArray(originalPlan.tasks) ? originalPlan.tasks : [];
        return {
            headline: this.sanitizeString(output.headline, originalPlan.headline || "Kế hoạch học hôm nay", dailyPlanSchema.maxHeadlineLength),
            motivation: this.sanitizeString(output.motivation, originalPlan.motivation || "Học từng bước nhỏ và giữ nhịp đều.", dailyPlanSchema.maxMotivationLength),
            tasks: this.validateEnhancedTasks(output.tasks, originalTasks)
        };
    }

    validateEnhancedTasks(tasks, originalTasks) {
        if (!Array.isArray(tasks)) return [];
        const allowedTypes = new Set(originalTasks.map(task => task.type).filter(Boolean));
        return tasks
            .filter(task => task && typeof task === "object" && allowedTypes.has(task.type))
            .map(task => ({
                type: task.type,
                title: this.sanitizeString(task.title, "", dailyPlanSchema.taskFields.maxTitleLength),
                description: this.sanitizeString(task.description, "", dailyPlanSchema.taskFields.maxDescriptionLength)
            }));
    }

    validateAgentChatReply(output) {
        const reply = this.sanitizeString(output.reply, "", chatReplySchema.maxReplyLength);
        if (!reply) {
            throw this.createInvalidAIResponseError("AI chat reply is missing reply.");
        }
        return {
            reply,
            corrections: this.validateCorrections(output.corrections, chatReplySchema.maxCorrections),
            suggestions: this.validateStringArray(output.suggestions, chatReplySchema.maxSuggestions, chatReplySchema.maxSuggestionLength)
        };
    }

    validateCorrections(corrections, maxItems = 3) {
        if (!Array.isArray(corrections)) return [];
        return corrections
            .filter(item => item && typeof item === "object")
            .map(item => ({
                original: this.sanitizeString(item.original, "", 160),
                corrected: this.sanitizeString(item.corrected, "", 160),
                explanation: this.sanitizeString(item.explanation, "", 260)
            }))
            .filter(item => item.original && item.corrected)
            .slice(0, maxItems);
    }

    validateAgentChatSummary(output, input = {}) {
        const allowedWeakSkills = new Set(chatSummarySchema.allowedWeakSkills);
        const summary = this.sanitizeString(output.summary, "", chatSummarySchema.maxSummaryLength);
        if (!summary) {
            throw this.createInvalidAIResponseError("AI chat summary is missing summary.");
        }
        return {
            summary,
            mistakes: this.validateStringArray(output.mistakes, chatSummarySchema.maxMistakes, chatSummarySchema.maxMistakeLength),
            weakSkills: this.validateStringArray(output.weakSkills, chatSummarySchema.maxWeakSkills, 40).filter(skill => allowedWeakSkills.has(skill)),
            recommendedNextActions: this.validateRecommendedActions(output.recommendedNextActions, input)
        };
    }

    validateWritingFeedback(output, input = {}) {
        const score = this.normalizeScore(output.score);
        return {
            score: score ?? 0,
            summary: this.sanitizeString(output.summary, "Bài viết đã được phân tích theo dữ liệu hiện có.", writingFeedbackSchema.maxSummaryLength),
            strengths: this.validateStringArray(output.strengths, writingFeedbackSchema.maxStrengths, writingFeedbackSchema.maxStrengthLength),
            corrections: this.validateCorrections(output.corrections, writingFeedbackSchema.maxCorrections),
            rubric: this.validateWritingRubric(output.rubric),
            rewriteSuggestion: this.sanitizeString(output.rewriteSuggestion, input.text || "", writingFeedbackSchema.maxRewriteLength),
            nextActions: this.validateRecommendedActions(output.nextActions, {
                dailyPlan: {
                    tasks: [
                        { action: { path: "/writing" } },
                        { action: { path: "/chat" } },
                        { action: { path: "/grammar-exercise" } },
                        { action: { path: "/vocabulary-exercise" } }
                    ]
                }
            })
        };
    }

    validateWritingRubric(rubric = {}) {
        return writingFeedbackSchema.rubricFields.reduce((result, field) => {
            result[field] = this.normalizeScore(rubric?.[field]);
            return result;
        }, {});
    }

    normalizeScore(value) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return Math.max(0, Math.min(10, Number(value.toFixed(1))));
        }
        if (typeof value !== "string") return null;
        const parsed = Number.parseFloat(value.replace(",", "."));
        if (!Number.isFinite(parsed)) return null;
        return Math.max(0, Math.min(10, Number(parsed.toFixed(1))));
    }

    validateRecommendedActions(actions, input = {}) {
        const dailyPlanTasks = input.dailyPlan?.tasks || input.plan?.tasks || [];
        const allowedPaths = new Set(dailyPlanTasks.map(task => task.action?.path).filter(Boolean));
        ["/chat", "/grammar-exercise", "/vocabulary-exercise", "/pronunciation-exercise", "/dictation-exercise", "/writing"].forEach(path => allowedPaths.add(path));
        if (!Array.isArray(actions)) return [];
        return actions
            .filter(action => action && typeof action === "object")
            .map(action => ({
                type: this.sanitizeString(action.type, "chat", 60),
                title: this.sanitizeString(action.title, "Luyện tiếp với AI Coach", 120),
                path: this.sanitizePath(action.path, "/chat", allowedPaths)
            }))
            .slice(0, 4);
    }

    sanitizeString(value, fallback = "", maxLength = 300) {
        if (typeof value !== "string") return fallback;
        const cleaned = value.trim();
        if (!cleaned) return fallback;
        return cleaned.slice(0, maxLength);
    }

    validateStringArray(value, maxItems = 10, maxLength = 120) {
        if (!Array.isArray(value)) return [];
        return value
            .map(item => this.sanitizeString(item, "", maxLength))
            .filter(Boolean)
            .slice(0, maxItems);
    }

    sanitizePath(path, fallback, allowedPaths) {
        if (typeof path !== "string" || !path.startsWith("/")) return fallback;
        return allowedPaths.has(path) ? path : fallback;
    }

    createInvalidAIResponseError(message) {
        const error = new Error(message);
        error.statusCode = 502;
        error.code = "AI_INVALID_RESPONSE";
        return error;
    }
}

module.exports = AIResponseSchemaGuard;
