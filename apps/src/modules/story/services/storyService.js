const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const StoryRepository = require('../repositories/storyRepository');
const storyImageService = require('../../story/services/storyImageService');
const { invalidateStoryCache } = require('../utils/cacheHelper');

class StoryService {
    constructor() {
        this.storyRepository = new StoryRepository();
        this.imageService = new storyImageService("easytalk/story");
    }

    async getStoryList(page = 1, limit = 12, category = "", level = "", search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `story:list:page=${page}:limit=${limit}:category=${category}:level=${level}:search=${search}:role=${role}`;
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
        const skip = (page - 1) * limit;
        const filter = {};
        if(role !== "admin") {
            filter.display = true;
        }
        if(category) filter.category = category;
        if(level) filter.level = level;
        if(search) filter.title = { $regex: search, $options: "i" };
        const { stories, total } = await this.storyRepository.findAll(filter, skip, limit);
        const result = { stories, totalStory: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getStory(id) {
        return await this.storyRepository.findById(id);
    }

    async getStoryBySlug(slug) {
        return await this.storyRepository.findBySlug(slug);
    }

    async insertStory(storyData, file = null) {
        let imageUrl = null;
        if(file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.storyRepository, 'story');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (storyData.image) {
            imageUrl = storyData.image;
        }
        const newStory = {
            title: storyData.title,
            description: storyData.description,
            level: storyData.level,
            category: storyData.category,
            image: imageUrl,
            content: [],
            slug: storyData.slug,
            sort: storyData.sort,
            display: storyData.display,
            createdAt: new Date()
        };
        if(storyData.content && Array.isArray(storyData.content)) {
            storyData.content.forEach(sentence => {
                const sentenceObj = {
                    en: sentence.en,
                    vi: sentence.vi,
                    vocabulary: sentence.vocabulary || [],
                    quiz: sentence.quiz
                    ? {
                        question: sentence.quiz.question,
                        type: sentence.quiz.type,
                        answer: sentence.quiz.answer,
                        explanation: sentence.quiz.explanation || '',
                        options: sentence.quiz.options || []
                    }
                    : null
                };
                newStory.content.push(sentenceObj);
            });
        }
        const result = await this.storyRepository.insert(newStory);
        await invalidateStoryCache();
        return result;
    }

    async updateStory(storyData, file = null) {
        const { _id, ...updateFields } = storyData;
        const existing = await this.getStory(_id);
        if(!existing) throw new Error("Story not found");
        if(updateFields.content && Array.isArray(updateFields.content)) {
            updateFields.content = updateFields.content.map(sentence => ({
                en: sentence.en,
                vi: sentence.vi,
                vocabulary: sentence.vocabulary || [],
                quiz: sentence.quiz
                ? {
                    question: sentence.quiz.question,
                    type: sentence.quiz.type,
                    answer: sentence.quiz.answer,
                    explanation: sentence.quiz.explanation || '',
                    options: sentence.quiz.options || []
                }
                : null
            }));
        }
        let imageUrl = existing.image || updateFields.image || "";
        if(file) {
            const existingPublicId = existing && existing.image ? this.imageService.extractPublicIdFromUrl(existing.image): null;
            if(existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.storyRepository, 'story');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        updateFields.image = imageUrl;
        updateFields.updatedAt = new Date();
        const result = await this.storyRepository.update(_id, updateFields);
        await invalidateStoryCache();
        return result;
    }

    async deleteStory(id) {
        const existing = await this.getStory(id);
        if(existing && existing.image) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.image);
            if(publicId) {
                await this.imageService.deleteImage(publicId);
            }
        }
        const result = await this.storyRepository.delete(id);
        await invalidateStoryCache();
        return result;
    }
}

module.exports = StoryService;