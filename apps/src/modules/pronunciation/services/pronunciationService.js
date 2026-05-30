const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const PronunciationRepository = require('../repositories/pronunciationRepository');
const pronunciationImageService = require('../services/pronunciationImageService');
const { invalidatePronunciationCache } = require('../utils/cacheHelper');
const { Pronunciation } = require('../models/pronunciation');

class PronunciationService {
    constructor() {
        this.pronunciationRepository = new PronunciationRepository();
        this.imageService = new pronunciationImageService("easytalk/pronunciation");
    }

    getUserProgressService() {
        if (!this._userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this._userProgressService = new UserProgressService();
        }
        return this._userProgressService;
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

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationPage = await this.getPronunciationList(1, 1);
            const firstPronunciation = firstPronunciationPage?.pronunciations?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, firstPronunciation ? firstPronunciation._id : null);
        }
        return userProgress;
    }

    async getPronunciationDetails(userId, pronunciationId) {
        const pronunciation = await this.getPronunciation(pronunciationId);
        if (!pronunciation) {
            return { status: 404, data: { message: "Pronunciation not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlocked = (userProgress.unlockedPronunciations || []).some(s => s.toString() == pronunciationId.toString());
        if (!isUnlocked) {
            return { status: 403, data: { success: false, message: "This pronunciation is locked for you. Please complete previous pronunciations first." } };
        }
        return { status: 200, data: { pronunciation, userProgress } };
    }

    async completePronunciation(userId, pronunciationId) {
        const pronunciation = await this.getPronunciation(pronunciationId);
        if (!pronunciation) {
            return { status: 404, data: { success: false, message: "Pronunciation not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId)
        const isPronunciationUnlocked = (userProgress.unlockedPronunciations || []).some(s => s.toString() == pronunciationId.toString());
        if (!isPronunciationUnlocked) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked pronunciation." } };
        }
        const pronunciationList = await this.getPronunciationList(1, 10000);
        const pronunciations = pronunciationList?.pronunciations || [];
        const currentPronuncationIndex = pronunciations.findIndex(s => s._id.toString() == pronunciationId.toString());
        let nextPronunciation = null;
        if (currentPronuncationIndex !== -1 && currentPronuncationIndex < pronunciations.length - 1) {
            nextPronunciation = pronunciations[currentPronuncationIndex + 1];
        }
        if (nextPronunciation) {
            userProgress = await userProgressService.unlockNextPronunciation(userProgress, nextPronunciation._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return {
            status: 200,
            data: {
                success: true,
                message: nextPronunciation ? "Pronunciation completed. Next pronunciation unlocked." : "Pronunciation completed. You have finished all pronunciations.",
                userProgress: {
                    unlockedPronunciations: updatedUserProgress.unlockedPronunciations,
                    experiencePoints: updatedUserProgress.experiencePoints,
                    streak: updatedUserProgress.streak,
                    maxStreak: updatedUserProgress.maxStreak,
                    studyDates: updatedUserProgress.studyDates
                }
            }
        };
    }

    async insertPronunciation(pronunciationData, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.pronunciationRepository, 'pronunciation');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (pronunciationData.images) {
            imageUrl = pronunciationData.images;
        }
        const document = Pronunciation.buildDocument({ ...pronunciationData, images: imageUrl });
        const result = await this.pronunciationRepository.insert(document);
        await invalidatePronunciationCache();
        return { status: 201, data: { message: "Bài học phát âm đã được thêm thành công !", result } };
    }

    async updatePronunciation(id, pronunciationData, file = null) {
        const existing = await this.getPronunciation(id);
        if (!existing) throw new Error("Bài học phát âm không tìm thấy.");
        let imageUrl = existing.images || pronunciationData.images || "";
        if (file) {
            const existingPublicId = existing.images ? this.imageService.extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.pronunciationRepository, 'pronunciation');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const document = Pronunciation.buildDocument({ ...pronunciationData, images: imageUrl });
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.pronunciationRepository.update(id, document);
        await invalidatePronunciationCache();
        return { status: 200, data: { message: "Bài học phát âm đã được cập nhật thành công !", result } };
    }

    async deletePronunciation(id) {
        const existing = await this.getPronunciation(id);
        if (!existing) return { status: 404, data: { message: "Bài học phát âm không tìm thấy." } };
        if (existing.images) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.images);
            if (publicId) await this.imageService.deleteImage(publicId);
        }
        await this.pronunciationRepository.delete(id);
        await invalidatePronunciationCache();
        return { status: 200, data: { message: "Bài học phát âm đã xóa thành công !" } };
    }
}

module.exports = PronunciationService;