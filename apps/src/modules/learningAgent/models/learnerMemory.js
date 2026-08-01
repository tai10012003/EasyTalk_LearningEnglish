const { ObjectId } = require('mongodb');

const PROFICIENCY_LEVELS = ['newbie', 'beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];
const LEARNING_GOALS = [
    'learning_journey',
    'story_lesson',
    'grammar_lesson',
    'pronunciation_lesson',
    'flashcard_practice',
    'grammar_practice',
    'vocabulary_practice',
    'pronunciation_practice',
    'dictation_practice',
    'ai_chat',
    'ai_writing'
];
const SKILLS = ['grammar', 'vocabulary', 'pronunciation', 'listening', 'speaking', 'writing'];
const MAX_LEARNING_GOALS = 3;
const MAX_WEAK_SKILLS = 2;
const TARGET_STUDY_MINUTES = [10, 20, 30, 45, 60, 90, 120];

class LearnerMemory {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.user = doc.user || null;
        this.proficiencyLevel = doc.proficiencyLevel || 'beginner';
        this.learningGoals = doc.learningGoals || ['learning_journey', 'ai_chat'];
        this.weakSkills = doc.weakSkills || [];
        this.frequentMistakes = doc.frequentMistakes || [];
        this.preferredTopics = doc.preferredTopics || [];
        this.learningSignals = doc.learningSignals || {};
        this.studyPreferences = doc.studyPreferences || {};
        this.memoryVersion = doc.memoryVersion || 'learner-memory-v1';
        this.createdAt = doc.createdAt || null;
        this.updatedAt = doc.updatedAt || null;
    }

    static getAllowedValues() {
        return {
            proficiencyLevels: PROFICIENCY_LEVELS,
            learningGoals: LEARNING_GOALS,
            skills: SKILLS,
            limits: {
                learningGoals: MAX_LEARNING_GOALS,
                weakSkills: MAX_WEAK_SKILLS
            },
            studyMinutes: TARGET_STUDY_MINUTES
        };
    }

    static buildDefaultDocument(userId) {
        const now = new Date();
        return {
            user: new ObjectId(userId),
            proficiencyLevel: 'beginner',
            learningGoals: ['learning_journey', 'ai_chat'],
            weakSkills: ['listening'],
            frequentMistakes: [],
            preferredTopics: [],
            learningSignals: {
                skills: {},
                mistakes: {},
                updatedAt: now
            },
            studyPreferences: {},
            memoryVersion: 'learner-memory-v1',
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
            update.learningGoals = LearnerMemory.normalizeArray(data.learningGoals, LEARNING_GOALS, MAX_LEARNING_GOALS);
        }
        if (data.weakSkills !== undefined) {
            update.weakSkills = LearnerMemory.normalizeArray(data.weakSkills, SKILLS, MAX_WEAK_SKILLS);
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
        if (data.studyPreferences !== undefined && data.studyPreferences && typeof data.studyPreferences === 'object' && !Array.isArray(data.studyPreferences)) {
            update.studyPreferences = LearnerMemory.sanitizeStudyPreferences(data.studyPreferences);
        }
        if (data.memoryVersion !== undefined && typeof data.memoryVersion === 'string') {
            update.memoryVersion = data.memoryVersion.trim().slice(0, 80);
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
            } else if (LearnerMemory.normalizeArray(data.learningGoals, LEARNING_GOALS, MAX_LEARNING_GOALS + 1).length > MAX_LEARNING_GOALS) {
                errors.push(`learningGoals can contain at most ${MAX_LEARNING_GOALS} values`);
            }
        }
        if (data.weakSkills !== undefined) {
            if (!Array.isArray(data.weakSkills)) {
                errors.push('weakSkills must be an array');
            } else if (data.weakSkills.some(skill => !SKILLS.includes(skill))) {
                errors.push(`weakSkills contains invalid values. Allowed: ${SKILLS.join(', ')}`);
            } else if (LearnerMemory.normalizeArray(data.weakSkills, SKILLS, MAX_WEAK_SKILLS + 1).length > MAX_WEAK_SKILLS) {
                errors.push(`weakSkills can contain at most ${MAX_WEAK_SKILLS} values`);
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
        if (data.studyPreferences !== undefined) {
            if (!data.studyPreferences || typeof data.studyPreferences !== 'object' || Array.isArray(data.studyPreferences)) {
                errors.push('studyPreferences must be an object');
            } else if (
                data.studyPreferences.targetStudyMinutes !== undefined
                && !TARGET_STUDY_MINUTES.includes(Number.parseInt(data.studyPreferences.targetStudyMinutes, 10))
            ) {
                errors.push(`studyPreferences.targetStudyMinutes must be one of: ${TARGET_STUDY_MINUTES.join(', ')}`);
            }
        }
        if (data.memoryVersion !== undefined && typeof data.memoryVersion !== 'string') {
            errors.push('memoryVersion must be a string');
        }
        return errors;
    }

    static sanitizeStudyPreferences(studyPreferences = {}) {
        const update = {};
        const targetStudyMinutes = Number.parseInt(studyPreferences.targetStudyMinutes, 10);
        if (TARGET_STUDY_MINUTES.includes(targetStudyMinutes)) {
            update.targetStudyMinutes = targetStudyMinutes;
            update.updatedAt = new Date();
        }
        return update;
    }

    static recommendTargetMinutes(memory = {}) {
        const weakSkillCount = Math.min(Array.isArray(memory?.weakSkills) ? memory.weakSkills.length : 0, MAX_WEAK_SKILLS);
        const goalCount = Math.min(Array.isArray(memory?.learningGoals) ? memory.learningGoals.filter(Boolean).length : 0, MAX_LEARNING_GOALS);
        const mistakeCount = Math.min(Array.isArray(memory?.frequentMistakes) ? memory.frequentMistakes.filter(Boolean).length : 0, 2);
        const focusCount = weakSkillCount + goalCount + mistakeCount;

        let minutes = 10;
        if (mistakeCount > 0) minutes += 10;
        if (weakSkillCount >= 1) minutes += weakSkillCount * 10;
        if (goalCount >= 2) minutes += 10;
        if (focusCount >= 5) minutes += 15;

        const recommendedMinutes = TARGET_STUDY_MINUTES.find(value => value >= minutes) || 120;
        const reasonParts = [];
        if (weakSkillCount) reasonParts.push(`${weakSkillCount} kỹ năng cần ưu tiên`);
        if (goalCount) reasonParts.push(`${goalCount} mục tiêu chính`);
        if (mistakeCount) reasonParts.push(`${mistakeCount} lỗi thường gặp cần xử lý trước`);

        return {
            minutes: recommendedMinutes,
            reason: reasonParts.length ? reasonParts.join(', ') : 'hồ sơ đang gọn, chỉ cần duy trì nhịp nhẹ'
        };
    }

    static resolveTargetStudyMinutes(memory = {}, requestedTargetMinutes = null) {
        const recommendation = LearnerMemory.recommendTargetMinutes(memory);
        const savedTargetMinutes = Number.parseInt(memory?.studyPreferences?.targetStudyMinutes, 10);
        const requested = Number.parseInt(requestedTargetMinutes, 10);
        const savedSelectionMinutes = TARGET_STUDY_MINUTES.includes(savedTargetMinutes)
            ? savedTargetMinutes
            : null;
        const profileMinimumMinutes = recommendation.minutes;
        const minimumSelectableMinutes = profileMinimumMinutes;
        const sourceMinutes = TARGET_STUDY_MINUTES.includes(requested)
            ? requested
            : savedSelectionMinutes || profileMinimumMinutes;
        const effectiveTargetMinutes = Math.max(sourceMinutes, minimumSelectableMinutes);
        return {
            effectiveTargetMinutes,
            requestedTargetMinutes: TARGET_STUDY_MINUTES.includes(requested) ? requested : null,
            savedTargetMinutes: savedSelectionMinutes,
            profileRecommendedMinutes: recommendation.minutes,
            recommendedMinutes: minimumSelectableMinutes,
            minimumSelectableMinutes,
            allowedMinutes: TARGET_STUDY_MINUTES.filter(minutes => minutes >= minimumSelectableMinutes),
            recommendationReason: recommendation.reason
        };
    }
}

module.exports = LearnerMemory;
