const { ObjectId } = require('mongodb');
const cache = require('../../../shared/utils/cacheService');
const StageRepository = require('../repositories/stageRepository');
const { invalidateStageCache } = require('../utils/cacheHelper');

class StageService {
    constructor() {
        this.repository = new StageRepository();
    }

    async getStageList(page = 1, limit = 12) {
        const cacheKey = `stage:list:page=${page}:limit=${limit}`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            const { stages, total } = await this.repository.findAll(page, limit);
            return { stages, totalStages: total };
        });
    }

    async getStageById(id) {
        const cacheKey = `stage:detail:id=${id}`;
        const ttl = 600;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            return await this.repository.findById(id);
        });
    }

    async getStagesInGate(gateId) {
        return await this.repository.findByGate(gateId);
    }

    async insertStage(stageData) {
        const formattedQuestions = this._formatQuestions(stageData.questions || []);
        const dataToInsert = {
            title: stageData.title,
            gate: stageData.gate,
            questions: formattedQuestions
        };
        const result = await this.repository.insert(dataToInsert);
        await invalidateStageCache();
        return result;
    }

    async updateStage(stageId, updateData) {
        const formattedQuestions = this._formatQuestions(updateData.questions || []);
        const dataToUpdate = {
            title: updateData.title,
            gate: new ObjectId(updateData.gate),
            questions: formattedQuestions
        };
        const result = await this.repository.update(stageId, dataToUpdate);
        await invalidateStageCache();
        return result;
    }

    async deleteStage(id) {
        const result = await this.repository.delete(id);
        await invalidateStageCache();
        return result;
    }

    async deleteStageByGate(gateId) {
        const result = await this.repository.deleteByGate(gateId);
        await invalidateStageCache();
        return result;
    }

    _formatQuestions(questions) {
        if (!Array.isArray(questions)) return [];
        return questions.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
    }
}

module.exports = StageService;