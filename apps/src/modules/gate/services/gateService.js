const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const GateRepository = require('../repositories/gateRepository');
const { invalidateGateCache } = require('../utils/cacheHelper');

class GateService {
    constructor() {
        this.repository = new GateRepository();
    }

    async getGateList(page = 1, limit = 12) {
        const redis = getRedisClient();
        const cacheKey = `gate:list:page=${page}:limit=${limit}`;
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
        const { gates, total } = await this.repository.findAll(page, limit);
        const result = { gates, totalGates: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGateById(gateId) {
        return await this.repository.findById(gateId);
    }

    async getGatesInJourney(journeyId) {
        return await this.repository.findByJourney(journeyId);
    }

    async insertGate(gate) {
        const result = await this.repository.insert(gate);
        await invalidateGateCache();
        return result;
    }

    async updateGate(gate) {
        const { _id, ...updateData } = gate;
        const result = await this.repository.update(_id, updateData);
        await invalidateGateCache();
        return result;
    }

    async deleteGate(id) {
        const result = await this.repository.delete(id);
        await invalidateGateCache();
        return result;
    }

    async deleteGatesByJourney(journeyId) {
        const result = await this.repository.deleteByJourney(journeyId);
        await invalidateGateCache();
        return result;
    }

    async addStageToGate(gateId, stageId) {
        const result = await this.repository.addStage(gateId, stageId);
        await invalidateGateCache();
        return result;
    }

    async removeStageFromGate(gateId, stageId) {
        const result = await this.repository.removeStage(gateId, stageId);
        await invalidateGateCache();
        return result;
    }
}

module.exports = GateService;