const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const JourneyRepository = require('../repositories/journeyRepository');
const { invalidateJourneyCache } = require('../utils/cacheHelper');

class JourneyService {
    constructor() {
        this.repository = new JourneyRepository();
    }

    async getJourneyList(page = 1, limit = 10) {
        const redis = getRedisClient();
        const cacheKey = `journey:list:page=${page}:limit=${limit}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const { journeys, total } = await this.repository.findAll(page, limit);
        const result = { journeys, totalJourneys: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getAllJourneysWithDetails() {
        const redis = getRedisClient();
        const cacheKey = `journey:allWithDetails`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const result = await this.repository.findAllWithDetails();
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getJourneyWithDetails(journeyId) {
        const redis = getRedisClient();
        const cacheKey = `journey:details:id=${journeyId}`;
        const ttl = 600;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const result = await this.repository.findByIdWithDetails(journeyId);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
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