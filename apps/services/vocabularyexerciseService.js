const { VocabularyexerciseRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class VocabularyexerciseService {
    constructor() {
        this.vocabularyexerciseRepository = new VocabularyexerciseRepository();
    }

    async getVocabularyExerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `vocabularyexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const result = await this.vocabularyexerciseRepository.findVocabularyExercises(filter, page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getVocabularyExerciseById(id) {
        return await this.vocabularyexerciseRepository.findVocabularyExerciseById(id);
    }

    async getVocabularyexerciseBySlug(slug) {
        return await this.vocabularyexerciseRepository.findVocabularyExerciseBySlug(slug);
    }

    async insertVocabularyExercise(exerciseData) {
        const result = await this.vocabularyexerciseRepository.insertVocabularyExercise(exerciseData);
        await this._invalidateCache();
        return result;
    }

    async updateVocabularyExercise(id, updateData) {
        const result = await this.vocabularyexerciseRepository.updateVocabularyExercise(id, updateData);
        await this._invalidateCache();
        return result;
    }

    async deleteVocabularyExercise(id) {
        const result = await this.vocabularyexerciseRepository.deleteVocabularyExercise(id);
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
            const deletedList = await scanAndDelete('vocabularyexercise:list:*');
            const deletedApi = await scanAndDelete('cache:/api/vocabulary-exercises*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`VocabularyExercise cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No vocabularyexercise cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate vocabularyexercise cache error:', err);
        }
    }
}

module.exports = VocabularyexerciseService;