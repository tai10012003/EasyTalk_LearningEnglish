const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const PronunciationExerciseRepository = require('../repositories/pronunciationexerciseRepository');
const { invalidatePronunciationExerciseCache } = require('../utils/cacheHelper');

class PronunciationExerciseService {
    constructor() {
        this.repository = new PronunciationExerciseRepository();
    }

    async getPronunciationexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `pronunciationexercise:list:page=${page}:limit=${limit}:role=${role}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if(cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }

        const filter = {};
        if(role !== "admin") {
            filter.display = true;
        }
        const { exercises, total } = await this.repository.findAll(filter, page, limit);
        const result = { pronunciationexercises: exercises, totalExercises: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getPronunciationexerciseById(id) {
        return await this.repository.findById(id);
    }

    async getPronunciationexerciseBySlug(slug) {
        return await this.repository.findBySlug(slug);
    }

    async insertPronunciationexercise(exerciseData) {
        const formattedQuestions = this._formatQuestions(exerciseData.questions || []);
        const newExercise = {
            title: exerciseData.title,
            questions: formattedQuestions,
            slug: exerciseData.slug,
            sort: exerciseData.sort,
            display: exerciseData.display,
            createdAt: new Date()
        };
        const result = await this.repository.insert(newExercise);
        await invalidatePronunciationExerciseCache();
        return result;
    }

    async updatePronunciationexercise(id, updateData) {
        const formattedQuestions = this._formatQuestions(updateData.questions || []);
        const update = {
            title: updateData.title.trim(),
            questions: formattedQuestions,
            slug: updateData.slug,
            sort: updateData.sort,
            display: updateData.display,
            updatedAt: new Date(),
        };
        const result = await this.repository.update(id, update);
        await invalidatePronunciationExerciseCache();
        return result;
    }

    async deletePronunciationexercise(id) {
        const result = await this.repository.delete(id);
        await invalidatePronunciationExerciseCache();
        return result;
    }

    _formatQuestions(questions) {
        if(!Array.isArray(questions)) return [];
        return questions.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || [],
        }));
    }
}

module.exports = PronunciationExerciseService;