const LearnerMemory = require('../models/learnerMemory');
const LearnerMemoryRepository = require('../repositories/learnerMemoryRepository');

class LearnerMemoryService {
    constructor(deps = {}) {
        this.repository = deps.repository || new LearnerMemoryRepository();
        this.weakSkillPromotionThreshold = deps.weakSkillPromotionThreshold || 3;
        this.weakSkillCooldownThreshold = deps.weakSkillCooldownThreshold || 3;
        this.mistakePromotionThreshold = deps.mistakePromotionThreshold || 2;
    }

    async getOrCreateMemory(userId) {
        let memory = await this.repository.findByUserId(userId);
        if (!memory) {
            memory = LearnerMemory.buildDefaultDocument(userId);
            await this.repository.insert(memory);
        }
        return memory;
    }

    async updateMemory(userId, data) {
        const errors = LearnerMemory.validateUpdate(data);
        if (errors.length > 0) {
            const error = new Error(errors.join(', '));
            error.statusCode = 400;
            error.code = 'INVALID_LEARNER_MEMORY';
            throw error;
        }
        const update = LearnerMemory.sanitizeUpdate(data);
        await this.repository.update(userId, update);
        return await this.getOrCreateMemory(userId);
    }

    async applySessionInsights(userId, insights = {}, options = {}) {
        const current = await this.getOrCreateMemory(userId);
        const evidence = this.buildEvidence(current, insights, options);
        const update = this.buildMemoryUpdateFromEvidence(current, insights, evidence);

        return await this.updateMemory(userId, update);
    }

    buildEvidence(current, insights = {}, options = {}) {
        const now = new Date();
        const learningSignals = current.learningSignals || {};
        const evidence = {
            skills: { ...(learningSignals.skills || {}) },
            mistakes: { ...(learningSignals.mistakes || {}) },
            updatedAt: now
        };

        const recentEvents = Array.isArray(options.recentEvents) ? options.recentEvents : [];
        const weakSkills = this.normalizeSkills(insights.weakSkills);
        const mistakes = this.normalizeMistakes(insights.mistakes);
        const positiveSkill = this.getPositiveSkill(options);
        const evidenceWeight = Number.parseInt(options.evidenceWeight || 1, 10);
        const fallbackWeight = Number.isNaN(evidenceWeight) || evidenceWeight < 1 ? 1 : evidenceWeight;

        for (const skill of weakSkills) {
            const counts = this.countSkillEvidence(skill, recentEvents);
            evidence.skills[skill] = {
                ...(evidence.skills[skill] || {}),
                negativeCount7d: Math.max(counts.negative, (evidence.skills[skill]?.negativeCount7d || 0) + (recentEvents.length ? 0 : fallbackWeight)),
                positiveCount7d: counts.positive || evidence.skills[skill]?.positiveCount7d || 0,
                lastNegativeAt: now,
                updatedAt: now
            };
        }

        if (positiveSkill) {
            const counts = this.countSkillEvidence(positiveSkill, recentEvents);
            evidence.skills[positiveSkill] = {
                ...(evidence.skills[positiveSkill] || {}),
                negativeCount7d: counts.negative || evidence.skills[positiveSkill]?.negativeCount7d || 0,
                positiveCount7d: Math.max(counts.positive, (evidence.skills[positiveSkill]?.positiveCount7d || 0) + (recentEvents.length ? 0 : fallbackWeight)),
                lastPositiveAt: now,
                updatedAt: now
            };
        }

        for (const mistake of mistakes) {
            const count = this.countMistakeEvidence(mistake, recentEvents);
            evidence.mistakes[mistake] = {
                ...(evidence.mistakes[mistake] || {}),
                count7d: Math.max(count, (evidence.mistakes[mistake]?.count7d || 0) + (recentEvents.length ? 0 : fallbackWeight)),
                lastSeenAt: now,
                updatedAt: now
            };
        }

        return evidence;
    }

    buildMemoryUpdateFromEvidence(current, insights, evidence) {
        const currentWeakSkills = new Set(current.weakSkills || []);
        const weakSkillsFromInsights = this.normalizeSkills(insights.weakSkills);
        for (const skill of weakSkillsFromInsights) {
            if ((evidence.skills[skill]?.negativeCount7d || 0) >= this.weakSkillPromotionThreshold) {
                currentWeakSkills.add(skill);
            }
        }
        for (const skill of [...currentWeakSkills]) {
            const signal = evidence.skills[skill] || {};
            if ((signal.positiveCount7d || 0) >= this.weakSkillCooldownThreshold && (signal.negativeCount7d || 0) === 0) {
                currentWeakSkills.delete(skill);
            }
        }

        const currentMistakes = new Set(current.frequentMistakes || []);
        for (const mistake of this.normalizeMistakes(insights.mistakes)) {
            if ((evidence.mistakes[mistake]?.count7d || 0) >= this.mistakePromotionThreshold) {
                currentMistakes.add(mistake);
            }
        }

        return {
            weakSkills: [...currentWeakSkills].slice(0, 7),
            frequentMistakes: [...currentMistakes].slice(-12),
            learningSignals: evidence
        };
    }

    countSkillEvidence(skill, events = []) {
        return events.reduce((counts, event) => {
            if ((event.weakSkills || []).includes(skill)) counts.negative += 1;
            if (event.skill === skill && typeof event.score === "number" && event.score >= 85 && !(event.weakSkills || []).includes(skill)) {
                counts.positive += 1;
            }
            return counts;
        }, { negative: 0, positive: 0 });
    }

    countMistakeEvidence(mistake, events = []) {
        return events.filter(event => (event.mistakes || []).includes(mistake)).length;
    }

    getPositiveSkill(options = {}) {
        const allowedSkills = LearnerMemory.getAllowedValues().skills;
        if (typeof options.score !== "number" || options.score < 85) return null;
        return allowedSkills.includes(options.skill) ? options.skill : null;
    }

    normalizeSkills(skills = []) {
        return LearnerMemory.normalizeArray(skills, LearnerMemory.getAllowedValues().skills, 7);
    }

    normalizeMistakes(mistakes = []) {
        return LearnerMemory.normalizeArray(mistakes, null, 12);
    }

    getAllowedValues() {
        return LearnerMemory.getAllowedValues();
    }

    async deleteMemory(userId) {
        return await this.repository.deleteByUserId(userId);
    }
}

module.exports = LearnerMemoryService;
