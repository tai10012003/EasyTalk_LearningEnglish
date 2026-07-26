const { ObjectId } = require("mongodb");
const AgentLearningEventRepository = require("../repositories/agentLearningEventRepository");

class AgentLearningEventService {
    constructor(deps = {}) {
        this.repository = deps.repository || new AgentLearningEventRepository();
        this.learnerMemoryService = deps.learnerMemoryService || null;
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
    }

    async recordEvent(userId, event = {}) {
        const insights = this.extractInsights(event);
        const document = {
            user: new ObjectId(userId),
            source: event.source || "unknown",
            skill: event.skill || null,
            eventType: event.eventType || "learning_activity",
            score: event.score ?? null,
            mistakes: insights.mistakes,
            weakSkills: insights.weakSkills,
            metadata: event.metadata || {},
            createdAt: new Date()
        };

        await this.repository.insert(document);
        if (this.learnerMemoryService && (insights.mistakes.length || insights.weakSkills.length || this.isPositiveEvidence(document))) {
            await this.applyEvidenceToMemory(userId, document, insights);
        }
        return document;
    }

    isPositiveEvidence(event = {}) {
        return typeof event.score === "number" && event.score >= 85 && Boolean(event.skill);
    }

    async applyEvidenceToMemory(userId, event, insights) {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        let recentEvents = [];
        if (typeof this.repository.findByUserSince === "function") {
            recentEvents = await this.repository.findByUserSince(userId, since);
        }
        await this.learnerMemoryService.applySessionInsights(userId, insights, {
            recentEvents: recentEvents.length ? recentEvents : [event],
            skill: event.skill,
            score: event.score
        });
    }

    async recordWritingAnalysis(userId, { score, feedback, textLength, mode = null }) {
        return await this.recordEvent(userId, {
            source: "writing",
            skill: "writing",
            eventType: "writing_analyzed",
            score: this.parseScore(score),
            metadata: {
                score,
                textLength,
                mode,
                feedbackPreview: typeof feedback === "string" ? feedback.slice(0, 500) : ""
            },
            feedback
        });
    }

    async recordDictationCompletion(userId, { exerciseId, title }) {
        return await this.recordEvent(userId, {
            source: "dictation",
            skill: "listening",
            eventType: "dictation_completed",
            weakSkills: ["listening"],
            metadata: {
                exerciseId,
                title
            }
        });
    }

    async recordPronunciationAnalysis(userId, { exerciseId, questionIndex, accuracy, detailedResult }) {
        const mistakes = this.extractPronunciationMistakes(detailedResult);
        const parsedAccuracy = this.parseScore(accuracy);
        return await this.recordEvent(userId, {
            source: "pronunciation",
            skill: "pronunciation",
            eventType: "pronunciation_analyzed",
            score: parsedAccuracy,
            weakSkills: parsedAccuracy !== null && parsedAccuracy < 80 ? ["pronunciation"] : [],
            mistakes,
            metadata: {
                exerciseId,
                questionIndex,
                accuracy,
                missedWords: mistakes.slice(0, 8)
            }
        });
    }

    async recordFlashcardDifficultyUpdate(userId, { updates = [] }) {
        const difficultCount = updates.filter(update => Number(update.difficulty) === 1).length;
        const reviewedCount = updates.length;
        return await this.recordEvent(userId, {
            source: "flashcard",
            skill: "vocabulary",
            eventType: "flashcard_difficulty_updated",
            score: reviewedCount ? Math.round(((reviewedCount - difficultCount) / reviewedCount) * 100) : null,
            weakSkills: difficultCount > 0 ? ["vocabulary"] : [],
            mistakes: difficultCount > 0 ? ["vocabulary recall"] : [],
            metadata: {
                reviewedCount,
                difficultCount
            }
        });
    }

    extractInsights(event = {}) {
        if (event.source === "writing") {
            return this.extractWritingInsights(event);
        }
        return {
            mistakes: Array.isArray(event.mistakes) ? event.mistakes.filter(Boolean).slice(0, 12) : [],
            weakSkills: Array.isArray(event.weakSkills) ? event.weakSkills.filter(Boolean).slice(0, 7) : []
        };
    }

    extractPronunciationMistakes(detailedResult = []) {
        if (!Array.isArray(detailedResult)) return [];
        return detailedResult
            .filter(item => item && item.match === false)
            .map(item => item.expected || item.correct || item.word || item.actual)
            .filter(Boolean)
            .slice(0, 12);
    }

    extractWritingInsights(event = {}) {
        const feedback = `${event.feedback || ""}`.toLowerCase();
        const score = typeof event.score === "number" ? event.score : this.parseScore(event.score);
        const weakSkills = new Set();
        const mistakes = new Set();

        if (score !== null && score < 7) weakSkills.add("writing");
        if (/(grammar|ngữ pháp|tense|thì|verb|sentence structure|cấu trúc câu)/i.test(feedback)) {
            weakSkills.add("grammar");
            mistakes.add("grammar or sentence structure");
        }
        if (/(vocabulary|từ vựng|word choice|collocation)/i.test(feedback)) {
            weakSkills.add("vocabulary");
            mistakes.add("vocabulary or word choice");
        }
        if (/(spelling|chính tả)/i.test(feedback)) {
            mistakes.add("spelling");
        }
        if (/(coherence|cohesion|mạch lạc|liên kết|logic)/i.test(feedback)) {
            weakSkills.add("writing");
            mistakes.add("coherence and organization");
        }

        return {
            mistakes: [...mistakes].slice(0, 12),
            weakSkills: [...weakSkills].slice(0, 7)
        };
    }

    parseScore(score) {
        if (typeof score === "number") return score;
        if (!score || score === "Không xác định") return null;
        const parsed = Number.parseFloat(String(score).replace(",", "."));
        return Number.isNaN(parsed) ? null : parsed;
    }

    async getRecentEvents(userId, limit = 20) {
        return await this.repository.findRecentByUser(userId, limit);
    }
}

module.exports = AgentLearningEventService;
