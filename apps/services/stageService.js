const { StageRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class StageService {
    constructor() {
        this.stageRepository = new StageRepository();
    }

    async getStageList(page = 1, limit = 12) {
        const redis = getRedisClient();
        const cacheKey = `stage:list:page=${page}:limit=${limit}`;
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
        const result = await this.stageRepository.findStages(page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
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
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const result = await this.stageRepository.findStageById(id);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getStagesInGate(gateId) {
        return await this.stageRepository.findStagesByGate(gateId);
    }

    async insertStage(stageData) {
        const result = await this.stageRepository.insertStage(stageData);
        await this._invalidateCache();
    }

    async updateStage(stageId, updateData) {
        const result = await this.stageRepository.updateStage(stageId, updateData);
        await this._invalidateCache();
        return result;
    }

    async deleteStage(id) {
        const result = await this.stageRepository.deleteStage(id);
        await this._invalidateCache();
        return result;
    }

    async deleteStageByGate(gateId) {
        const result = await this.stageRepository.deleteStagesByGate(gateId);
        await this._invalidateCache();
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
            const deletedList = await scanAndDelete('stage:list:*');
            const deletedDetail = await scanAndDelete('stage:detail:*');
            const deletedApi = await scanAndDelete('cache:/api/stage*');
            const total = deletedList + deletedDetail + deletedApi;
            if (total > 0) {
                console.log(`Stage cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No stage cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate stage cache error:', err);
        }
    }
}

module.exports = StageService;