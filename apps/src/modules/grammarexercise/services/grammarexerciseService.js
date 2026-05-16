const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const GrammarExerciseRepository = require('../repositories/grammarexerciseRepository');
const { invalidateGrammarExerciseCache } = require('../utils/cacheHelper');

class GrammarExerciseService {
    constructor() {
        this.repository = new GrammarExerciseRepository();
    }

    async getGrammarexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `grammarexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const result = { grammarexercises: exercises, totalExercises: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGrammarexerciseById(id) {
        return await this.repository.findById(id);
    }

    async getGrammarexerciseBySlug(slug) {
        return await this.repository.findBySlug(slug);
    }

    async insertGrammarexercise(exerciseData) {
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
        await invalidateGrammarExerciseCache();
        return result;
    }

    async updateGrammarexercise(id, updateData) {
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
        await invalidateGrammarExerciseCache();
        return result;
    }

    async deleteGrammarexercise(id) {
        const result = await this.repository.delete(id);
        await invalidateGrammarExerciseCache();
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

module.exports = GrammarExerciseService;