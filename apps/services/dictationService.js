const { DictationRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class DictationService {
    constructor() {
        this.dictationRepository = new DictationRepository();
    }

    async getDictationList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `dictation:list:page=${page}:limit=${limit}:role=${role}`;
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
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        const result = await this.dictationRepository.findDictations(filter, page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getDictation(id) {
        return await this.dictationRepository.findDictationById(id);
    }

    async getDictationBySlug(slug) {
        return await this.dictationRepository.findDictationBySlug(slug);
    }

    async insertDictation(dictationData) {
        const result = await this.dictationRepository.insertDictation(dictationData);
        await this._invalidateCache();
        return result;
    }

    async updateDictation(dictationData) {
        const result = await this.dictationRepository.updateDictation(dictationData);
        await this._invalidateCache();
        return result;
    }

    async deleteDictation(id) {
        const result = await this.dictationRepository.deleteDictation(id);
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
            const deletedList = await scanAndDelete('dictationexercises:list:*');
            const deletedApi = await scanAndDelete('cache:/api/dictation-exercises*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`Dictation cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No dictation cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate dictation cache error:', err);
        }
    }
}

module.exports = DictationService;