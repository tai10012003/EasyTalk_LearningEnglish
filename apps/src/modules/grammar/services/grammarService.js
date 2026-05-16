const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const GrammarRepository = require('../repositories/grammarRepository');
const grammarImageService = require('../services/grammarImageService');
const { invalidateGrammarCache } = require('../utils/cacheHelper');

class GrammarService {
    constructor() {
        this.grammarRepository = new GrammarRepository();
        this.imageService = new grammarImageService("easytalk/grammar");
    }

    async getGrammarList(page = 1, limit = 12, search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `grammar:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
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
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        if (search) filter.title = { $regex: search, $options: "i" };
        const { grammars, total } = await this.grammarRepository.findAll(filter, skip, limit);
        const result = { grammars, totalGrammars: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGrammar(id) {
        return await this.grammarRepository.findById(id);
    }

    async getGrammarBySlug(slug) {
        return await this.grammarRepository.findBySlug(slug);
    }

    async insertGrammar(grammar, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.grammarRepository, 'grammar');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (grammar.images) {
            imageUrl = grammar.images;
        }
        const newGrammar = {
            title: grammar.title,
            description: grammar.description,
            category: grammar.category,
            level: grammar.level,
            content: grammar.content,
            images: imageUrl,
            quizzes: [],
            slug: grammar.slug,
            sort: grammar.sort,
            display: grammar.display,
            createdAt: new Date()
        };
        if (grammar.quizzes && Array.isArray(grammar.quizzes)) {
            grammar.quizzes.forEach(question => {
                newGrammar.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        const result = await this.grammarRepository.insert(newGrammar);
        await invalidateGrammarCache();
        return result;
    }

    async updateGrammar(id, grammar, file = null) {
        const formattedQuestions = grammar.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const existing = await this.getGrammar(id);
        let imageUrl = existing && existing.images ? existing.images : (grammar.images || "");
        if (file) {
            const existingPublicId = existing && existing.images ? this.imageService.extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.grammarRepository, 'grammar');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const updateData = {
            title: grammar.title.trim(),
            description: grammar.description.trim(),
            content: grammar.content.trim(),
            category: grammar.category.trim(),
            level: grammar.level.trim(),
            images: imageUrl,
            quizzes: formattedQuestions,
            slug: grammar.slug,
            sort: grammar.sort,
            display: grammar.display,
            updatedAt: new Date()
        };
        const result = await this.grammarRepository.update(id, updateData);
        await invalidateGrammarCache();
        return result;
    }

    async deleteGrammar(id) {
        const existing = await this.getGrammar(id);
        if (existing && existing.images) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.images);
            if (publicId) {
                await this.imageService.deleteImage(publicId);
            }
        }
        const result = await this.grammarRepository.delete(id);
        await invalidateGrammarCache();
        return result;
    }
}

module.exports = GrammarService;