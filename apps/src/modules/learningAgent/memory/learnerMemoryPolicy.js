const MemoryScoring = require('./memoryScoring');
const MemorySummarizer = require('./memorySummarizer');
const MemoryVersioning = require('./memoryVersioning');

class LearnerMemoryPolicy {
    constructor(options = {}) {
        this.scoring = options.scoring || new MemoryScoring(options);
        this.summarizer = options.summarizer || new MemorySummarizer();
        this.versioning = options.versioning || new MemoryVersioning(options);
    }

    buildUpdate(current, insights = {}, options = {}) {
        const evidence = this.buildEvidence(current, insights, options);
        const update = this.buildMemoryUpdateFromEvidence(current, insights, evidence);
        return this.versioning.applyVersion(update);
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
        const weakSkills = this.summarizer.normalizeSkills(insights.weakSkills);
        const mistakes = this.summarizer.normalizeMistakes(insights.mistakes);
        const positiveSkill = this.scoring.getPositiveSkill(options);
        const evidenceWeight = Number.parseInt(options.evidenceWeight || 1, 10);
        const fallbackWeight = Number.isNaN(evidenceWeight) || evidenceWeight < 1 ? 1 : evidenceWeight;

        for (const skill of weakSkills) {
            const counts = this.scoring.countSkillEvidence(skill, recentEvents);
            evidence.skills[skill] = {
                ...(evidence.skills[skill] || {}),
                negativeCount7d: Math.max(counts.negative, (evidence.skills[skill]?.negativeCount7d || 0) + (recentEvents.length ? 0 : fallbackWeight)),
                positiveCount7d: counts.positive || evidence.skills[skill]?.positiveCount7d || 0,
                lastNegativeAt: now,
                updatedAt: now
            };
        }

        if (positiveSkill) {
            const counts = this.scoring.countSkillEvidence(positiveSkill, recentEvents);
            evidence.skills[positiveSkill] = {
                ...(evidence.skills[positiveSkill] || {}),
                negativeCount7d: counts.negative || evidence.skills[positiveSkill]?.negativeCount7d || 0,
                positiveCount7d: Math.max(counts.positive, (evidence.skills[positiveSkill]?.positiveCount7d || 0) + (recentEvents.length ? 0 : fallbackWeight)),
                lastPositiveAt: now,
                updatedAt: now
            };
        }

        for (const mistake of mistakes) {
            const count = this.scoring.countMistakeEvidence(mistake, recentEvents);
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
        const weakSkillsFromInsights = this.summarizer.normalizeSkills(insights.weakSkills);
        for (const skill of weakSkillsFromInsights) {
            if (this.scoring.shouldPromoteWeakSkill(skill, evidence)) {
                currentWeakSkills.add(skill);
            }
        }
        for (const skill of [...currentWeakSkills]) {
            if (this.scoring.shouldCooldownWeakSkill(skill, evidence)) {
                currentWeakSkills.delete(skill);
            }
        }

        const currentMistakes = new Set(current.frequentMistakes || []);
        for (const mistake of this.summarizer.normalizeMistakes(insights.mistakes)) {
            if (this.scoring.shouldPromoteMistake(mistake, evidence)) {
                currentMistakes.add(mistake);
            }
        }

        return {
            weakSkills: this.summarizer.limitWeakSkills([...currentWeakSkills]),
            frequentMistakes: this.summarizer.limitFrequentMistakes([...currentMistakes]),
            learningSignals: evidence
        };
    }
}

module.exports = LearnerMemoryPolicy;
