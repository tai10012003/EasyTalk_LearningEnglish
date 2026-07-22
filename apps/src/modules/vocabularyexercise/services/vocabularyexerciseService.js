const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const VocabularyExerciseRepository = require('../repositories/vocabularyexerciseRepository');
const { invalidateVocabularyExerciseCache } = require('../utils/cacheHelper');
const { VocabularyExercise } = require('../models/vocabularyexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class VocabularyExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new VocabularyExerciseRepository();
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

    async getVocabularyexerciseList(page = 1, limit = 12, role = "user") {
        const cacheKey = cacheNs.listKey('vocabularyexercise', { page, limit, role });
        return await this.cache.getOrSet(cacheKey, withTags(policies.contentList('vocabularyexercise', role), cacheNs.listTags('vocabularyexercise')), async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { vocabularyexercises: exercises, totalExercises: total };
        });
    }

    async getVocabularyexerciseById(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('vocabularyexercise', id), withTags(policies.contentDetail('vocabularyexercise'), cacheNs.itemTags('vocabularyexercise', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getVocabularyexerciseBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('vocabularyexercise', slug), withTags(policies.contentDetail('vocabularyexercise'), cacheNs.itemTags('vocabularyexercise', null, slug)), async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstVocabularyExercisePage = await this.getVocabularyexerciseList(1, 1);
            const firstVocabularyExercise = firstVocabularyExercisePage?.vocabularyexercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, null, firstVocabularyExercise ? firstVocabularyExercise._id : null, null);
        }
        return userProgress;
    }

    async getVocabularyExerciseDetails(userId, vocabularyExerciseId) {
        const vocabularyExercise = await this.getVocabularyexerciseById(vocabularyExerciseId);
        if (!vocabularyExercise) {
            return { status: 404, data: { message: "Vocabulary exercise not found." } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedVocabularyExercise = (userProgress.unlockedVocabularyExercises || []).some(s => s.toString() == vocabularyExerciseId.toString());
        if (!isUnlockedVocabularyExercise) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked vocabulary exercise." } };
        }
        return { status: 200, data: { vocabularyExercise, userProgress } };
    }

    async completeVocabularyExercise(userId, vocabularyExerciseId) {
        const vocabularyExercise = await this.getVocabularyexerciseById(vocabularyExerciseId);
        if (!vocabularyExercise) {
            return { status: 404, data: { success: false, message: "Vocabulary exercise not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedVocabularyExercise = (userProgress.unlockedVocabularyExercises || []).some(s => s.toString() == vocabularyExerciseId.toString());
        if (!isUnlockedVocabularyExercise) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked vocabulary exercise." } };
        }
        const { nextItem: nextVocabularyExercise, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: vocabularyExercise,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextVocabularyExercise.bind(userProgressService),
            unlockedField: "unlockedVocabularyExercises"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextVocabularyExercise ? "Vocabulary exercise completed. Next vocabulary exercise unlocked." : "Vocabulary exercise completed. You have finished all vocabulary exercise.",
                userProgress: completedProgress
            }
        };
    }

    async insertVocabularyexercise(exerciseData) {
        const document = VocabularyExercise.buildDocument(exerciseData);
        const result = await this.repository.insert(document);
        await invalidateVocabularyExerciseCache({ id: result.insertedId, slug: document.slug });
        return { status: 201, data: { success: true, message: "Bài luyện tập từ vựng đã được thêm thành công !", result } };
    }

    async updateVocabularyexercise(id, exerciseData) {
        const existing = await this.getVocabularyexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập từ vựng không tìm thấy." } };
        }
        const document = VocabularyExercise.buildDocument(exerciseData);
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidateVocabularyExerciseCache({ id, slugs: [existing.slug, document.slug] });
        return { status: 200, data: { success: true, message: "Bài luyện tập từ vựng đã được cập nhật thành công !", result } };
    }

    async deleteVocabularyexercise(id) {
        const existing = await this.getVocabularyexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập từ vựng không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidateVocabularyExerciseCache({ id, slug: existing.slug });
        return { status: 200, data: { success: true, message: "Bài luyện tập từ vựng đã xóa thành công !" } };
    }
}

module.exports = VocabularyExerciseService;
