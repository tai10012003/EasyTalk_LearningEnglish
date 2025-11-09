const { GrammarexerciseRepository } = require('./../repositories');
const { getRedisClient } = require('../util/redisClient');

class GrammarexerciseService {
    constructor() {
        this.grammarexerciseRepository = new GrammarexerciseRepository();
    }

    async getGrammarexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `grammarexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const result = await this.grammarexerciseRepository.findGrammarExercises(filter, page, limit);
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGrammarexerciseById(id) {
        return await this.grammarexerciseRepository.findGrammarExerciseById(id);
    }

    async getGrammarexerciseBySlug(slug) {
        return await this.grammarexerciseRepository.findGrammarExerciseBySlug(slug);
    }

    async insertGrammarexercise(exerciseData) {
        const result = await this.grammarexerciseRepository.insertGrammarExercise(exerciseData);
        await this._invalidateCache();
        return result;
    }

    async updateGrammarexercise(id, updateData) {
        const result = await this.grammarexerciseRepository.updateGrammarExercise(id, updateData);
        await this._invalidateCache();
        return result;
    }

    async deleteGrammarexercise(id) {
        const result = await this.grammarexerciseRepository.deleteGrammarExercise(id);
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
            const deletedList = await scanAndDelete('grammarexercise:list:*');
            const deletedApi = await scanAndDelete('cache:/api/grammar-exercises*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`GrammarExercise cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No grammarexercise cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate grammarexercise cache error:', err);
        }
    }
}

module.exports = GrammarexerciseService;