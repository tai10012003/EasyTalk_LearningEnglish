const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const PronunciationRepository = require('../repositories/pronunciationRepository');
const pronunciationImageService = require('../services/pronunciationImageService');
const { invalidatePronunciationCache } = require('../utils/cacheHelper');

class PronunciationService {
    constructor() {
        this.pronunciationRepository = new PronunciationRepository();
        this.imageService = new pronunciationImageService("easytalk/pronunciation");
    }

    async getPronunciationList(page = 1, limit = 12, search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `pronunciation:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
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
        const { pronunciations, total } = await this.pronunciationRepository.findAll(filter, skip, limit);
        const result = { pronunciations, totalPronunciations: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getPronunciation(id) {
        return await this.pronunciationRepository.findById(id);
    }

    async getPronunciationBySlug(slug) {
        return await this.pronunciationRepository.findBySlug(slug);
    }

    async insertPronunciation(pronunciation, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.pronunciationRepository, 'pronunciation');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (pronunciation.images) {
            imageUrl = pronunciation.images;
        }
        const newPronunciation = {
            title: pronunciation.title,
            description: pronunciation.description,
            category: pronunciation.category,
            level: pronunciation.level,
            content: pronunciation.content,
            images: imageUrl,
            quizzes: [],
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            createdAt: new Date()
        };
        if (pronunciation.quizzes && Array.isArray(pronunciation.quizzes)) {
            pronunciation.quizzes.forEach(question => {
                newPronunciation.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        const result = await this.pronunciationRepository.insert(newPronunciation);
        await invalidatePronunciationCache();
        return result;
    }

    async updatePronunciation(id, pronunciation, file = null) {
        const formattedQuestions = pronunciation.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const existing = await this.getPronunciation(id);
        let imageUrl = existing && existing.images ? existing.images : (pronunciation.images || "");
        if (file) {
            const existingPublicId = existing && existing.images ? this.imageService.extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.pronunciationRepository, 'pronunciation');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const updateData = {
            title: pronunciation.title.trim(),
            description: pronunciation.description.trim(),
            content: pronunciation.content.trim(),
            category: pronunciation.category.trim(),
            level: pronunciation.level.trim(),
            images: imageUrl,
            quizzes: formattedQuestions,
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            updatedAt: new Date()
        };
        const result = await this.pronunciationRepository.update(id, updateData);
        await invalidatePronunciationCache();
        return result;
    }

    async deletePronunciation(id) {
        const existing = await this.getPronunciation(id);
        if (existing && existing.images) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.images);
            if (publicId) {
                await this.imageService.deleteImage(publicId);
            }
        }
        const result = await this.pronunciationRepository.delete(id);
        await invalidatePronunciationCache();
        return result;
    }
}

module.exports = PronunciationService;