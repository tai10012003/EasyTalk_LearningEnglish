const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const GateRepository = require('../repositories/gateRepository');
const { invalidateGateCache } = require('../utils/cacheHelper');

class GateService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new GateRepository();
        this.cache = options.cacheService || cache;
    }

    async getGateList(page = 1, limit = 12) {
        const cacheKey = cacheNs.listKey('gate', { page, limit });
        return await this.cache.getOrSet(cacheKey, withTags(policies.relationList('gate'), cacheNs.listTags('gate')), async () => {
            const { gates, total } = await this.repository.findAll(page, limit);
            return { gates, totalGates: total };
        });
    }

    async getGateById(gateId) {
        return await this.cache.getOrSet(cacheNs.itemKey('gate', gateId), withTags(policies.relationDetail('gate'), cacheNs.itemTags('gate', gateId)), async () => {
            return await this.repository.findById(gateId);
        });
    }

    async getGatesInJourney(journeyId) {
        return await this.cache.getOrSet(cacheNs.key('gate', 'journey', { id: journeyId }), withTags(policies.relationDetail('gate'), [cacheNs.tag('gate', 'journey'), cacheNs.tag('gate', 'journey', journeyId), cacheNs.tag('gate', 'all')]), async () => {
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
