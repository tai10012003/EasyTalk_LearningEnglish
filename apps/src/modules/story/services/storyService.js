const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const StoryRepository = require('../repositories/storyRepository');
const storyImageService = require('./storyImageService');
const { invalidateStoryCache } = require('../utils/cacheHelper');
const { Story } = require('../model/story');

class StoryService {
    constructor() {
        this.storyRepository = new StoryRepository();
        this.imageService = new storyImageService("easytalk/story");
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getStoryList(page = 1, limit = 12, category = "", level = "", search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `story:list:page=${page}:limit=${limit}:category=${category}:level=${level}:search=${search}:role=${role}`;
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
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (search) filter.title = { $regex: search, $options: "i" };
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

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstStoryPage = await this.getStoryList(1, 1);
            const firstStory = firstStoryPage?.stories?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, firstStory?._id || null, null, null);
        }
        return userProgress;
    }

    async getStoryDetails(userId, storyId) {
        const story = await this.getStory(storyId);
        if (!story) {
            return { status: 404, data: { success: false, message: "Story not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isUnlocked) {
            return { status: 403, data: { success: false, message: "This story is locked for you. Please complete previous stories first." } };
        }
        return { status: 200, data: { success: true, data: story, userProgress } };
    }

    async completeStory(userId, storyId) {
        const story = await this.getStory(storyId);
        if (!story) return { status: 404, data: { success: false, message: "Story not found" } };
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isStoryUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isStoryUnlocked) return { status: 403, data: { success: false, message: "You cannot complete a locked story." } };
        const storyList = await this.getStoryList(1, 10000);
        const stories = storyList?.stories || [];
        const currentStoryIndex = stories.findIndex(s => s._id.toString() == storyId.toString());
        let nextStory = null;
        if (currentStoryIndex !== -1 && currentStoryIndex < stories.length - 1) nextStory = stories[currentStoryIndex + 1];
        if (nextStory) {
            userProgress = await userProgressService.unlockNextStory(userProgress, nextStory._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return {
            status: 200,
            data: {
                success: true,
                message: nextStory ? "Story completed. Next story unlocked." : "Story completed. You have finished all stories.",
                userProgress: {
                    unlockedStories: updatedUserProgress.unlockedStories,
                    experiencePoints: updatedUserProgress.experiencePoints,
                    streak: updatedUserProgress.streak,
                    maxStreak: updatedUserProgress.maxStreak,
                    studyDates: updatedUserProgress.studyDates
                }
            }
        };
    }

    async insertStory(storyData, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.storyRepository, 'story');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (storyData.image) {
            imageUrl = storyData.image;
        }
        const document = Story.buildDocument({ ...storyData, image: imageUrl });
        const result = await this.storyRepository.insert(document);
        await invalidateStoryCache();
        return { status: 201, data: { success: true, message: "Câu chuyện đã được thêm thành công!", result } };
    }

    async updateStory(id, storyData, file = null) {
        const existing = await this.getStory(id);
        if (!existing) return { status: 404, data: { success: false, message: "Câu chuyện không tìm thấy." } };
        let imageUrl = existing.image || storyData.image || "";
        if (file) {
            const existingPublicId = existing.image ? this.imageService.extractPublicIdFromUrl(existing.image) : null;
            if (existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.storyRepository, 'story');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const document = Story.buildDocument({ ...storyData, image: imageUrl });
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.storyRepository.update(id, document);
        await invalidateStoryCache();
        return { status: 200, data: { success: true, message: "Câu chuyện đã được cập nhật thành công!", result } };
    }

    async deleteStory(id) {
        const existing = await this.getStory(id);
        if (!existing) return { status: 404, data: { success: false, message: "Câu chuyện không tìm thấy." } };
        if (existing.image) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.image);
            if (publicId) {
                await this.imageService.deleteImage(publicId);
            }
        }
        await this.storyRepository.delete(id);
        await invalidateStoryCache();
        return { status: 200, data: { success: true, message: "Câu chuyện đã xóa thành công!" } };
    }
}

module.exports = StoryService;