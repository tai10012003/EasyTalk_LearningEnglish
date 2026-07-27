const LearnerMemory = require('../models/learnerMemory');

class MemoryScoring {
    constructor(options = {}) {
        this.weakSkillPromotionThreshold = options.weakSkillPromotionThreshold || 3;
        this.weakSkillCooldownThreshold = options.weakSkillCooldownThreshold || 3;
        this.mistakePromotionThreshold = options.mistakePromotionThreshold || 2;
    }

    shouldPromoteWeakSkill(skill, evidence) {
        return (evidence.skills?.[skill]?.negativeCount7d || 0) >= this.weakSkillPromotionThreshold;
    }

    shouldCooldownWeakSkill(skill, evidence) {
        const signal = evidence.skills?.[skill] || {};
        return (signal.positiveCount7d || 0) >= this.weakSkillCooldownThreshold && (signal.negativeCount7d || 0) === 0;
    }

    shouldPromoteMistake(mistake, evidence) {
        return (evidence.mistakes?.[mistake]?.count7d || 0) >= this.mistakePromotionThreshold;
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
}

module.exports = MemoryScoring;
