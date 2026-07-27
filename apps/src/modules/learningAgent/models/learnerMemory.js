const { ObjectId } = require('mongodb');

const PROFICIENCY_LEVELS = ['newbie', 'beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];
const LEARNING_GOALS = ['daily_habit', 'communication', 'pronunciation', 'vocabulary', 'grammar', 'listening', 'writing', 'exam', 'work'];
const SKILLS = ['speaking', 'listening', 'reading', 'writing', 'grammar', 'vocabulary', 'pronunciation'];
const COACH_TONES = ['friendly', 'strict', 'encouraging', 'concise'];

class LearnerMemory {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.user = doc.user || null;
        this.proficiencyLevel = doc.proficiencyLevel || 'beginner';
        this.learningGoals = doc.learningGoals || ['daily_habit', 'communication'];
        this.weakSkills = doc.weakSkills || [];
        this.frequentMistakes = doc.frequentMistakes || [];
        this.preferredTopics = doc.preferredTopics || [];
        this.learningSignals = doc.learningSignals || {};
        this.memoryVersion = doc.memoryVersion || 'learner-memory-v1';
        this.coachTone = doc.coachTone || 'friendly';
        this.notes = doc.notes || '';
        this.createdAt = doc.createdAt || null;
        this.updatedAt = doc.updatedAt || null;
    }

    static getAllowedValues() {
        return {
            proficiencyLevels: PROFICIENCY_LEVELS,
            learningGoals: LEARNING_GOALS,
            skills: SKILLS,
            coachTones: COACH_TONES
        };
    }

    static buildDefaultDocument(userId) {
        const now = new Date();
        return {
            user: new ObjectId(userId),
            proficiencyLevel: 'beginner',
            learningGoals: ['daily_habit', 'communication'],
            weakSkills: [],
            frequentMistakes: [],
            preferredTopics: [],
            learningSignals: {
                skills: {},
                mistakes: {},
                updatedAt: now
            },
            memoryVersion: 'learner-memory-v1',
            coachTone: 'friendly',
            notes: '',
            createdAt: now,
            updatedAt: now
        };
    }

    static normalizeArray(value, allowedValues = null, limit = 10) {
        if (!Array.isArray(value)) return [];
        const normalized = value
            .map(item => typeof item === 'string' ? item.trim() : '')
            .filter(Boolean);
        const filtered = allowedValues ? normalized.filter(item => allowedValues.includes(item)) : normalized;
        return [...new Set(filtered)].slice(0, limit);
    }

    static sanitizeUpdate(data = {}) {
        const update = {};
        if (data.proficiencyLevel !== undefined && PROFICIENCY_LEVELS.includes(data.proficiencyLevel)) {
            update.proficiencyLevel = data.proficiencyLevel;
        }
        if (data.learningGoals !== undefined) {
            update.learningGoals = LearnerMemory.normalizeArray(data.learningGoals, LEARNING_GOALS, 6);
        }
        if (data.weakSkills !== undefined) {
            update.weakSkills = LearnerMemory.normalizeArray(data.weakSkills, SKILLS, 7);
        }
        if (data.frequentMistakes !== undefined) {
            update.frequentMistakes = LearnerMemory.normalizeArray(data.frequentMistakes, null, 12);
        }
        if (data.preferredTopics !== undefined) {
            update.preferredTopics = LearnerMemory.normalizeArray(data.preferredTopics, null, 12);
        }
        if (data.learningSignals !== undefined && data.learningSignals && typeof data.learningSignals === 'object' && !Array.isArray(data.learningSignals)) {
            update.learningSignals = data.learningSignals;
        }
        if (data.memoryVersion !== undefined && typeof data.memoryVersion === 'string') {
            update.memoryVersion = data.memoryVersion.trim().slice(0, 80);
        }
        if (data.coachTone !== undefined && COACH_TONES.includes(data.coachTone)) {
            update.coachTone = data.coachTone;
        }
        if (data.notes !== undefined && typeof data.notes === 'string') {
            update.notes = data.notes.trim().slice(0, 1000);
        }
        update.updatedAt = new Date();
        return update;
    }

    static validateUpdate(data = {}) {
        const errors = [];
        if (data.proficiencyLevel !== undefined && !PROFICIENCY_LEVELS.includes(data.proficiencyLevel)) {
            errors.push(`proficiencyLevel must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
        }
        if (data.learningGoals !== undefined) {
            if (!Array.isArray(data.learningGoals)) {
                errors.push('learningGoals must be an array');
            } else if (data.learningGoals.some(goal => !LEARNING_GOALS.includes(goal))) {
                errors.push(`learningGoals contains invalid values. Allowed: ${LEARNING_GOALS.join(', ')}`);
            }
        }
        if (data.weakSkills !== undefined) {
            if (!Array.isArray(data.weakSkills)) {
                errors.push('weakSkills must be an array');
            } else if (data.weakSkills.some(skill => !SKILLS.includes(skill))) {
                errors.push(`weakSkills contains invalid values. Allowed: ${SKILLS.join(', ')}`);
            }
        }
        if (data.frequentMistakes !== undefined && !Array.isArray(data.frequentMistakes)) {
            errors.push('frequentMistakes must be an array');
        }
        if (data.preferredTopics !== undefined && !Array.isArray(data.preferredTopics)) {
            errors.push('preferredTopics must be an array');
        }
        if (data.learningSignals !== undefined && (!data.learningSignals || typeof data.learningSignals !== 'object' || Array.isArray(data.learningSignals))) {
            errors.push('learningSignals must be an object');
        }
        if (data.memoryVersion !== undefined && typeof data.memoryVersion !== 'string') {
            errors.push('memoryVersion must be a string');
        }
        if (data.coachTone !== undefined && !COACH_TONES.includes(data.coachTone)) {
            errors.push(`coachTone must be one of: ${COACH_TONES.join(', ')}`);
        }
        if (data.notes !== undefined && typeof data.notes !== 'string') {
            errors.push('notes must be a string');
        }
        return errors;
    }
}

module.exports = LearnerMemory;
