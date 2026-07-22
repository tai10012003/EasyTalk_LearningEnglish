const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const StoryRepository = require('../repositories/storyRepository');
const storyImageService = require('./storyImageService');
const { invalidateStoryCache } = require('../utils/cacheHelper');
const { Story } = require('../model/story');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class StoryService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new StoryRepository();
        this.imageService = options.imageService || new storyImageService("easytalk/story");
        this.cache = options.cacheService || cache;
        this.userProgressService = options.userProgressService || null;
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getStoryList(page = 1, limit = 12, category = "", level = "", search = "", role = "user") {
        const cacheKey = cacheNs.listKey('story', { page, limit, category, level, search, role });
        return await this.cache.getOrSet(cacheKey, withTags(policies.contentList('story', role), cacheNs.listTags('story')), async () => {
            const skip = (page - 1) * limit;
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            if (category) filter.category = category;
            if (level) filter.level = level;
            if (search) filter.title = { $regex: search, $options: "i" };
            const { stories, total } = await this.repository.findAll(filter, skip, limit);
            return { stories, totalStory: total };
        });
    }

    async getStory(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('story', id), withTags(policies.contentDetail('story'), cacheNs.itemTags('story', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getStoryBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('story', slug), withTags(policies.contentDetail('story'), cacheNs.itemTags('story', null, slug)), async () => {
            return await this.repository.findBySlug(slug);
        });
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
        const { nextItem: nextStory, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: story,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextStory.bind(userProgressService),
            unlockedField: "unlockedStories"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextStory ? "Story completed. Next story unlocked." : "Story completed. You have finished all stories.",
                userProgress: completedProgress
            }
        };
    }

    async insertStory(storyData, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'story');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (storyData.image) {
            imageUrl = storyData.image;
        }
        const document = Story.buildDocument({ ...storyData, image: imageUrl });
        const result = await this.repository.insert(document);
        await invalidateStoryCache({ id: result.insertedId, slug: document.slug });
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
                const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'story');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const document = Story.buildDocument({ ...storyData, image: imageUrl });
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidateStoryCache({ id, slugs: [existing.slug, document.slug] });
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
        await this.repository.delete(id);
        await invalidateStoryCache({ id, slug: existing.slug });
        return { status: 200, data: { success: true, message: "Câu chuyện đã xóa thành công!" } };
    }
}

module.exports = StoryService;
