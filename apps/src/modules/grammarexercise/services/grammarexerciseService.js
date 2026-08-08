const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const GrammarExerciseRepository = require('../repositories/grammarexerciseRepository');
const { invalidateGrammarExerciseCache } = require('../utils/cacheHelper');
const { GrammarExercise } = require('../models/grammarexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class GrammarExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new GrammarExerciseRepository();
        this.cache = options.cacheService || cache;
        this.userProgressService = options.userProgressService || null;
        this.englishTranslationService = options.englishTranslationService || null;
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getGrammarexerciseList(page = 1, limit = 12, role = "user", lang = "vi") {
        const cacheKey = cacheNs.listKey('grammarexercise', { page, limit, role });
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.contentList('grammarexercise', role), cacheNs.listTags('grammarexercise')), async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { grammarexercises: exercises, totalExercises: total };
        });
        if (lang === "en" && this.englishTranslationService && role !== "admin") {
            return {
                ...result,
                grammarexercises: await this.englishTranslationService.applyTranslations("grammarExercise", result.grammarexercises, lang)
            };
        }
        return result;
    }

    async getGrammarexerciseById(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('grammarexercise', id), withTags(policies.contentDetail('grammarexercise'), cacheNs.itemTags('grammarexercise', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getGrammarexerciseBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('grammarexercise', slug), withTags(policies.contentDetail('grammarexercise'), cacheNs.itemTags('grammarexercise', null, slug)), async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async getLocalizedGrammarexerciseBySlug(slug, lang = "vi") {
        const grammarExercise = await this.getGrammarexerciseBySlug(slug);
        if (lang === "en" && this.englishTranslationService) {
            return await this.englishTranslationService.applyTranslationToItem("grammarExercise", grammarExercise, lang);
        }
        return grammarExercise;
    }

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstGrammarExercisePage = await this.getGrammarexerciseList(1, 1);
            const firstGrammarExercise = firstGrammarExercisePage?.grammarexercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, firstGrammarExercise ? firstGrammarExercise._id : null, null, null, null);
        }
        return userProgress;
    }

    async getGrammarExerciseDetails(userId, grammarExerciseId, lang = "vi") {
        const grammarExercise = await this.getGrammarexerciseById(grammarExerciseId);
        if (!grammarExercise) {
            return { status: 404, data: { message: "Grammar exercise not found." } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedGrammarExercise = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarExerciseId.toString());
        if (!isUnlockedGrammarExercise) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked grammar exercise." } };
        }
        const localizedGrammarExercise = lang === "en" && this.englishTranslationService
            ? await this.englishTranslationService.applyTranslationToItem("grammarExercise", grammarExercise, lang)
            : grammarExercise;
        return { status: 200, data: { grammarExercise: localizedGrammarExercise, userProgress } };
    }

    async completeGrammarExercise(userId, grammarExerciseId) {
        const grammarExercise = await this.getGrammarexerciseById(grammarExerciseId);
        if (!grammarExercise) {
            return { status: 404, data: { success: false, message: "Grammar exercise not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedGrammarExercise = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarExerciseId.toString());
        if (!isUnlockedGrammarExercise) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked grammar exercise." } };
        }
        const { nextItem: nextGrammarExercise, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: grammarExercise,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextGrammarExercise.bind(userProgressService),
            unlockedField: "unlockedGrammarExercises"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextGrammarExercise ? "Grammar exercise completed. Next grammar exercise unlocked." : "Grammar exercise completed. You have finished all grammar exercise.",
                userProgress: completedProgress
            }
        };
    }

    async insertGrammarexercise(exerciseData) {
        const document = GrammarExercise.buildDocument(exerciseData);
        const result = await this.repository.insert(document);
        await invalidateGrammarExerciseCache({ id: result.insertedId, slug: document.slug });
        return { status: 201, data: { success: true, message: "Bài luyện tập ngữ pháp đã được thêm thành công !", result } };
    }

    async updateGrammarexercise(id, exerciseData) {
        const existing = await this.getGrammarexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." } };
        }
        const document = GrammarExercise.buildDocument(exerciseData);
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidateGrammarExerciseCache({ id, slugs: [existing.slug, document.slug] });
        return { status: 200, data: { success: true, message: "Bài luyện tập ngữ pháp đã được cập nhật thành công !", result } };
    }

    async deleteGrammarexercise(id) {
        const existing = await this.getGrammarexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." } };
        }
        await this.repository.delete(id);
        if (this.englishTranslationService) {
            await this.englishTranslationService.deleteTranslation("grammarExercise", id);
        }
        await invalidateGrammarExerciseCache({ id, slug: existing.slug });
        return { status: 200, data: { success: true, message: "Bài luyện tập ngữ pháp đã xóa thành công !" } };
    }
}

module.exports = GrammarExerciseService;
