const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const DictationExerciseRepository = require('../repositories/dictationexerciseRepository');
const { invalidateDictationCache } = require('../utils/cacheHelper');

class DictationExerciseService {
    constructor() {
        this.repository = new DictationExerciseRepository();
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
        const { dictations, total } = await this.repository.findAll(filter, page, limit);
        const result = { dictationExercises: dictations, totalDictationExercises: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getDictation(id) {
        return await this.repository.findById(id);
    }

    async getDictationBySlug(slug) {
        return await this.repository.findBySlug(slug);
    }

    async insertDictation(dictationData) {
        const result = await this.repository.insert(dictationData);
        await invalidateDictationCache();
        return result;
    }

    async updateDictation(dictationData) {
        const { _id, ...updateFields } = dictationData;
        const result = await this.repository.update(_id, updateFields);
        await invalidateDictationCache();
        return result;
    }

    async deleteDictation(id) {
        const result = await this.repository.delete(id);
        await invalidateDictationCache();
        return result;
    }
}

module.exports = DictationExerciseService;