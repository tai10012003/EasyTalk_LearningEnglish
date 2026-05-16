const { ObjectId } = require('mongodb');
const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const StageRepository = require('../repositories/stageRepository');
const { invalidateStageCache } = require('../utils/cacheHelper');

class StageService {
    constructor() {
        this.repository = new StageRepository();
    }

    async getStageList(page = 1, limit = 12) {
        const redis = getRedisClient();
        const cacheKey = `stage:list:page=${page}:limit=${limit}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if(cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const { stages, total } = await this.repository.findAll(page, limit);
        const result = { stages, totalStages: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch(err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getStageById(id) {
        const redis = getRedisClient();
        const cacheKey = `stage:detail:id=${id}`;
        const ttl = 600;
        try {
            const cached = await redis.get(cacheKey);
            if(cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch(err) {
            console.error('Direct cache get error:', err);
        }
        const result = await this.repository.findById(id);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch(err) {
            console.error('Direct cache set error:', err);
        }
        return result;
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