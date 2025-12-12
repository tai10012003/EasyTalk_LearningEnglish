const { JourneyRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class JourneyService {
    constructor() {
        this.journeyRepository = new JourneyRepository();
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
        const result = await this.journeyRepository.findJourneys(page, limit);
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
        const result = await this.journeyRepository.findAllJourneysWithDetails();
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
        const result = await this.journeyRepository.findJourneyWithDetails(journeyId);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getJourney(id) {
        return await this.journeyRepository.findJourneyById(id);
    }

    async insertJourney(journey) {
        const result = await this.journeyRepository.insertJourney(journey);
        await this._invalidateCache();
        return result;
    }

    async addGateToJourney(journeyId, gateId) {
        const result = await this.journeyRepository.addGate(journeyId, gateId);
        await this._invalidateCache();
        return result;
    }

    async removeGateFromJourney(journeyId, gateId) {
        const result = await this.journeyRepository.removeGate(journeyId, gateId);
        await this._invalidateCache();
        return result;
    }

    async updateJourney(journey) {
        const result = await this.journeyRepository.updateJourney(journey);
        await this._invalidateCache();
        return result;
    }

    async deleteJourney(id) {
        const result = await this.journeyRepository.deleteJourney(id);
        await this._invalidateCache();
        return result;
    }

    async _invalidateCache() {
        const redis = getRedisClient();
        const scanAndDelete = async (pattern) => {
            let cursor = '0';
            let totalDeleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                if (keys.length > 0) {
                    const deleted = await redis.del(keys);
                    totalDeleted += deleted;
                }
                cursor = nextCursor;
            } while (cursor !== '0');
            return totalDeleted;
        };
        try {
            const deletedList = await scanAndDelete('journey:list:*');
            const deletedAll = await scanAndDelete('journey:allWithDetails');
            const deletedDetail = await scanAndDelete('journey:details:*');
            const deletedApi = await scanAndDelete('cache:/api/journey*');
            const total = deletedList + deletedAll + deletedDetail + deletedApi;
            if (total > 0) {
                console.log(`Journey cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No journey cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate journey cache error:', err);
        }
    }
}

module.exports = JourneyService;