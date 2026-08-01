const LearnerMemory = require('../models/learnerMemory');
const LearnerMemoryRepository = require('../repositories/learnerMemoryRepository');
const LearnerMemoryPolicy = require('../memory/learnerMemoryPolicy');

class LearnerMemoryService {
    constructor(deps = {}) {
        this.repository = deps.repository || new LearnerMemoryRepository();
        this.memoryPolicy = deps.memoryPolicy || new LearnerMemoryPolicy({
            weakSkillPromotionThreshold: deps.weakSkillPromotionThreshold,
            weakSkillCooldownThreshold: deps.weakSkillCooldownThreshold,
            mistakePromotionThreshold: deps.mistakePromotionThreshold
        });
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
        const current = await this.getOrCreateMemory(userId);
        const update = LearnerMemory.sanitizeUpdate(data);
        if (this.shouldResetStudyPreferencesAfterProfileUpdate(data)) {
            const nextMemory = {
                ...current,
                ...update
            };
            const recommendation = LearnerMemory.recommendTargetMinutes(nextMemory);
            update.studyPreferences = {
                targetStudyMinutes: recommendation.minutes,
                updatedAt: new Date()
            };
        }
        await this.repository.update(userId, update);
        return await this.getOrCreateMemory(userId);
    }

    shouldResetStudyPreferencesAfterProfileUpdate(data = {}) {
        if (data.studyPreferences !== undefined) return false;
        return data.proficiencyLevel !== undefined
            || data.learningGoals !== undefined
            || data.weakSkills !== undefined
            || data.frequentMistakes !== undefined
            || data.preferredTopics !== undefined;
    }

    async updateStudyPreferences(userId, data = {}) {
        const current = await this.getOrCreateMemory(userId);
        const targetMinutes = Number.parseInt(data.targetStudyMinutes, 10);
        const resolved = LearnerMemory.resolveTargetStudyMinutes(current, targetMinutes);
        if (targetMinutes < resolved.minimumSelectableMinutes) {
            const error = new Error(`Thời gian học tối thiểu theo hồ sơ hiện tại là ${resolved.minimumSelectableMinutes} phút.`);
            error.statusCode = 400;
            error.code = 'TARGET_STUDY_MINUTES_TOO_LOW';
            throw error;
        }
        return await this.updateMemory(userId, {
            studyPreferences: {
                targetStudyMinutes: resolved.effectiveTargetMinutes
            }
        });
    }

    resolveTargetStudyMinutes(memory = {}, requestedTargetMinutes = null) {
        return LearnerMemory.resolveTargetStudyMinutes(memory, requestedTargetMinutes);
    }

    async applySessionInsights(userId, insights = {}, options = {}) {
        const current = await this.getOrCreateMemory(userId);
        const update = this.memoryPolicy.buildUpdate(current, insights, options);

        return await this.updateMemory(userId, update);
    }

    buildEvidence(current, insights = {}, options = {}) {
        return this.memoryPolicy.buildEvidence(current, insights, options);
    }

    buildMemoryUpdateFromEvidence(current, insights, evidence) {
        return this.memoryPolicy.buildMemoryUpdateFromEvidence(current, insights, evidence);
    }

    countSkillEvidence(skill, events = []) {
        return this.memoryPolicy.scoring.countSkillEvidence(skill, events);
    }

    countMistakeEvidence(mistake, events = []) {
        return this.memoryPolicy.scoring.countMistakeEvidence(mistake, events);
    }

    getPositiveSkill(options = {}) {
        return this.memoryPolicy.scoring.getPositiveSkill(options);
    }

    normalizeSkills(skills = []) {
        return this.memoryPolicy.summarizer.normalizeSkills(skills);
    }

    normalizeMistakes(mistakes = []) {
        return this.memoryPolicy.summarizer.normalizeMistakes(mistakes);
    }

    getAllowedValues() {
        return LearnerMemory.getAllowedValues();
    }

    async deleteMemory(userId) {
        return await this.repository.deleteByUserId(userId);
    }
}

module.exports = LearnerMemoryService;
