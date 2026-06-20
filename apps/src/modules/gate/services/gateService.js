const cache = require('../../../shared/utils/cacheService');
const GateRepository = require('../repositories/gateRepository');
const { invalidateGateCache } = require('../utils/cacheHelper');

class GateService {
    constructor() {
        this.repository = new GateRepository();
    }

    async getGateList(page = 1, limit = 12) {
        const cacheKey = `gate:list:page=${page}:limit=${limit}`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            const { gates, total } = await this.repository.findAll(page, limit);
            return { gates, totalGates: total };
        });
    }

    async getGateById(gateId) {
        return await cache.getOrSet(`gate:item:id=${gateId}`, 600, async () => {
            return await this.repository.findById(gateId);
        });
    }

    async getGatesInJourney(journeyId) {
        return await cache.getOrSet(`gate:journey:id=${journeyId}`, 600, async () => {
            return await this.repository.findByJourney(journeyId);
        });
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