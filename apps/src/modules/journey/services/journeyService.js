const cache = require('../../../shared/utils/cacheService');
const JourneyRepository = require('../repositories/journeyRepository');
const { invalidateJourneyCache } = require('../utils/cacheHelper');

class JourneyService {
    constructor() {
        this.repository = new JourneyRepository();
    }

    async getJourneyList(page = 1, limit = 10) {
        const cacheKey = `journey:list:page=${page}:limit=${limit}`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            const { journeys, total } = await this.repository.findAll(page, limit);
            return { journeys, totalJourneys: total };
        });
    }

    async getAllJourneysWithDetails() {
        const cacheKey = `journey:allWithDetails`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            return await this.repository.findAllWithDetails();
        });
    }

    async getJourneyWithDetails(journeyId) {
        const cacheKey = `journey:details:id=${journeyId}`;
        const ttl = 600;
        return await cache.getOrSet(cacheKey, ttl, async () => {
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