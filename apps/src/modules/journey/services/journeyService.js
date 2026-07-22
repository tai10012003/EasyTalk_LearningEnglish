const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const JourneyRepository = require('../repositories/journeyRepository');
const { invalidateJourneyCache } = require('../utils/cacheHelper');

class JourneyService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new JourneyRepository();
        this.cache = options.cacheService || cache;
    }

    async getJourneyList(page = 1, limit = 10) {
        const cacheKey = cacheNs.listKey('journey', { page, limit });
        return await this.cache.getOrSet(cacheKey, withTags(policies.relationList('journey'), cacheNs.listTags('journey')), async () => {
            const { journeys, total } = await this.repository.findAll(page, limit);
            return { journeys, totalJourneys: total };
        });
    }

    async getAllJourneysWithDetails() {
        const cacheKey = cacheNs.key('journey', 'details', { id: 'all' });
        return await this.cache.getOrSet(cacheKey, withTags(policies.relationList('journey'), [cacheNs.tag('journey', 'details'), cacheNs.tag('journey', 'all')]), async () => {
            return await this.repository.findAllWithDetails();
        });
    }

    async getJourneyWithDetails(journeyId) {
        const cacheKey = cacheNs.key('journey', 'details', { id: journeyId });
        return await this.cache.getOrSet(cacheKey, withTags(policies.relationDetail('journey'), [cacheNs.tag('journey', 'details'), cacheNs.tag('journey', 'details', journeyId), cacheNs.tag('journey', 'all')]), async () => {
            return await this.repository.findByIdWithDetails(journeyId);
        });
    }

    async getJourney(id) {
        return await this.repository.findById(id);
    }

    async insertJourney(journey) {
        const result = await this.repository.insert(journey);
        await invalidateJourneyCache();
        return result;
    }

    async addGateToJourney(journeyId, gateId) {
        const result = await this.repository.addGate(journeyId, gateId);
        await invalidateJourneyCache();
        return result;
    }

    async removeGateFromJourney(journeyId, gateId) {
        const result = await this.repository.removeGate(journeyId, gateId);
        await invalidateJourneyCache();
        return result;
    }

    async updateJourney(journey) {
        const { _id, ...updateData } = journey;
        const result = await this.repository.update(_id, updateData);
        await invalidateJourneyCache();
        return result;
    }

    async deleteJourney(id) {
        const result = await this.repository.delete(id);
        await invalidateJourneyCache();
        return result;
    }
}

module.exports = JourneyService;
