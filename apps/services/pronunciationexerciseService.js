const { PronunciationexerciseRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class PronunciationexerciseService {
    constructor() {
        this.pronunciationexerciseRepository = new PronunciationexerciseRepository();
    }

    async getPronunciationexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `pronunciationexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const result = await this.pronunciationexerciseRepository.findPronunciationExercises(filter, page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getPronunciationexerciseById(id) {
        return await this.pronunciationexerciseRepository.findPronunciationExerciseById(id);
    }

    async getPronunciationexerciseBySlug(slug) {
        return await this.pronunciationexerciseRepository.findPronunciationExerciseBySlug(slug);
    }

    async insertPronunciationexercise(exerciseData) {
        const result = await this.pronunciationexerciseRepository.insertPronunciationExercise(exerciseData);
        await this._invalidateCache();
        return result;
    }

    async updatePronunciationexercise(id, updateData) {
        const result = await this.pronunciationexerciseRepository.updatePronunciationExercise(id, updateData);
        await this._invalidateCache();
        return result;
    }

    async deletePronunciationexercise(id) {
        const result = await this.pronunciationexerciseRepository.deletePronunciationExercise(id);
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
            const deletedList = await scanAndDelete('pronunciationexercise:list:*');
            const deletedApi = await scanAndDelete('cache:/api/pronunciation-exercises*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`PronunciationExercise cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No pronunciationexercise cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate pronunciationexercise cache error:', err);
        }
    }
}

module.exports = PronunciationexerciseService;