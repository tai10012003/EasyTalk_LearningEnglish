const { GateRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');
class GateService {
    constructor() {
        this.gateRepository = new GateRepository();
    }

    async getGateList(page = 1, limit = 12) {
        const redis = getRedisClient();
        const cacheKey = `gate:list:page=${page}:limit=${limit}`;
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
        const result = await this.gateRepository.findGates(page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGateById(gateId) {
        return await this.gateRepository.findGateById(gateId);
    }

    async getGatesInJourney(journeyId) {
        return await this.gateRepository.findGatesByJourney(journeyId);
    }

    async insertGate(gate) {
        const result = await this.gateRepository.insertGate(gate);
        await this._invalidateCache();
        return result;
    }

    async updateGate(gate) {
        const result = await this.gateRepository.updateGate(gate);
        await this._invalidateCache();
        return result;
    }

    async deleteGate(id) {
        const result = await this.gateRepository.deleteGate(id);
        await this._invalidateCache();
        return result;
    }

    async deleteGatesByJourney(journeyId) {
        const result = await this.gateRepository.deleteGatesByJourney(journeyId);
        await this._invalidateCache();
        return result;
    }

    async addStageToGate(gateId, stageId) {
        const result = await this.gateRepository.addStage(gateId, stageId);
        await this._invalidateCache();
        return result;
    }

    async removeStageFromGate(gateId, stageId) {
        const result = await this.gateRepository.removeStage(gateId, stageId);
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
            const deletedList = await scanAndDelete('gate:list:*');
            const deletedApi = await scanAndDelete('cache:/api/gate*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`Gate cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No gate cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate gate cache error:', err);
        }
    }
}

module.exports = GateService;