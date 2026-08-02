const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const PronunciationRepository = require('../repositories/pronunciationRepository');
const pronunciationImageService = require('../services/pronunciationImageService');
const { invalidatePronunciationCache } = require('../utils/cacheHelper');
const { Pronunciation } = require('../models/pronunciation');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class PronunciationService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new PronunciationRepository();
        this.imageService = options.imageService || new pronunciationImageService("easytalk/pronunciation");
        this.cache = options.cacheService || cache;
        this._userProgressService = options.userProgressService || null;
        this.englishTranslationService = options.englishTranslationService || null;
    }

    getUserProgressService() {
        if (!this._userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this._userProgressService = new UserProgressService();
        }
        return this._userProgressService;
    }

    async getPronunciationList(page = 1, limit = 12, search = "", role = "user", lang = "vi") {
        const cacheKey = cacheNs.listKey('pronunciation', { page, limit, search, role });
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.contentList('pronunciation', role), cacheNs.listTags('pronunciation')), async () => {
            const skip = (page - 1) * limit;
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            if (search) filter.title = { $regex: search, $options: "i" };
            const { pronunciations, total } = await this.repository.findAll(filter, skip, limit);
            return { pronunciations, totalPronunciations: total };
        });
        if (lang === "en" && this.englishTranslationService && role !== "admin") {
            return {
                ...result,
                pronunciations: await this.englishTranslationService.applyTranslations("pronunciation", result.pronunciations, lang)
            };
        }
        return result;
    }

    async getPronunciation(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('pronunciation', id), withTags(policies.contentDetail('pronunciation'), cacheNs.itemTags('pronunciation', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getPronunciationBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('pronunciation', slug), withTags(policies.contentDetail('pronunciation'), cacheNs.itemTags('pronunciation', null, slug)), async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async getLocalizedPronunciationBySlug(slug, lang = "vi") {
        const pronunciation = await this.getPronunciationBySlug(slug);
        if (lang === "en" && this.englishTranslationService) {
            return await this.englishTranslationService.applyTranslationToItem("pronunciation", pronunciation, lang);
        }
        return pronunciation;
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

    async getPronunciationDetails(userId, pronunciationId, lang = "vi") {
        const pronunciation = await this.getPronunciation(pronunciationId);
        if (!pronunciation) {
            return { status: 404, data: { message: "Pronunciation not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlocked = (userProgress.unlockedPronunciations || []).some(s => s.toString() == pronunciationId.toString());
        if (!isUnlocked) {
            return { status: 403, data: { success: false, message: "This pronunciation is locked for you. Please complete previous pronunciations first." } };
        }
        const localizedPronunciation = lang === "en" && this.englishTranslationService
            ? await this.englishTranslationService.applyTranslationToItem("pronunciation", pronunciation, lang)
            : pronunciation;
        return { status: 200, data: { pronunciation: localizedPronunciation, userProgress } };
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
        const { nextItem: nextPronunciation, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: pronunciation,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextPronunciation.bind(userProgressService),
            unlockedField: "unlockedPronunciations"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextPronunciation ? "Pronunciation completed. Next pronunciation unlocked." : "Pronunciation completed. You have finished all pronunciations.",
                userProgress: completedProgress
            }
        };
    }

    async insertPronunciation(pronunciationData, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'pronunciation');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (pronunciationData.images) {
            imageUrl = pronunciationData.images;
        }
        const document = Pronunciation.buildDocument({ ...pronunciationData, images: imageUrl });
        const result = await this.repository.insert(document);
        await invalidatePronunciationCache({ id: result.insertedId, slug: document.slug });
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
                const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'pronunciation');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const document = Pronunciation.buildDocument({ ...pronunciationData, images: imageUrl });
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidatePronunciationCache({ id, slugs: [existing.slug, document.slug] });
        return { status: 200, data: { message: "Bài học phát âm đã được cập nhật thành công !", result } };
    }

    async deletePronunciation(id) {
        const existing = await this.getPronunciation(id);
        if (!existing) return { status: 404, data: { message: "Bài học phát âm không tìm thấy." } };
        if (existing.images) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.images);
            if (publicId) await this.imageService.deleteImage(publicId);
        }
        await this.repository.delete(id);
        if (this.englishTranslationService) {
            await this.englishTranslationService.deleteTranslation("pronunciation", id);
        }
        await invalidatePronunciationCache({ id, slug: existing.slug });
        return { status: 200, data: { message: "Bài học phát âm đã xóa thành công !" } };
    }
}

module.exports = PronunciationService;
