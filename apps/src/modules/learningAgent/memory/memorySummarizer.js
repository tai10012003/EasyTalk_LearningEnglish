const LearnerMemory = require('../models/learnerMemory');

class MemorySummarizer {
    normalizeSkills(skills = []) {
        return LearnerMemory.normalizeArray(skills, LearnerMemory.getAllowedValues().skills, 7);
    }

    normalizeMistakes(mistakes = []) {
        return LearnerMemory.normalizeArray(mistakes, null, 12);
    }

    limitWeakSkills(skills = []) {
        return [...new Set(skills)].slice(0, 7);
    }

    limitFrequentMistakes(mistakes = []) {
        return [...new Set(mistakes)].slice(-12);
    }
}

module.exports = MemorySummarizer;
