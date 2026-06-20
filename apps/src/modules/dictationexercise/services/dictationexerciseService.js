const cache = require('../../../shared/utils/cacheService');
const DictationExerciseRepository = require('../repositories/dictationexerciseRepository');
const { invalidateDictationExerciseCache } = require('../utils/cacheHelper');
const DictationExercise = require('../models/dictationexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class DictationExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new DictationExerciseRepository();
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

    async getDictationList(page = 1, limit = 12, role = "user") {
        const cacheKey = `dictation:list:page=${page}:limit=${limit}:role=${role}`;
        const ttl = 300;
        return await this.cache.getOrSet(cacheKey, ttl, async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { dictations, total } = await this.repository.findAll(filter, page, limit);
            return { dictationExercises: dictations, totalDictationExercises: total };
        });
    }

    async getDictation(id) {
        return await this.cache.getOrSet(`dictation:item:id=${id}`, 600, async () => {
            return await this.repository.findById(id);
        });
    }

    async getDictationBySlug(slug) {
        return await this.cache.getOrSet(`dictation:item:slug=${slug}`, 600, async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstDictationExercisePage = await this.getDictationList(1, 1);
            const firstDictationExercise = firstDictationExercisePage?.dictationExercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, null, null, firstDictationExercise ? firstDictationExercise._id : null);
        }
        return userProgress;
    }

    async getDictationExerciseDetails(userId, dictationId) {
        const dictationExercise = await this.getDictation(dictationId);
        if (!dictationExercise) {
            return { status: 404, data: { message: "Dictation exercise not found." } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedDictation = (userProgress.unlockedDictations || []).some(s => s.toString() == dictationId.toString());
        if (!isUnlockedDictation) {
            return { status: 403, data: { success: false, message: "This dictation exercise is locked for you. Please complete previous dictation exercise first." } };
        }
        return { status: 200, data: { success: true, data: dictationExercise, userProgress } };
    }

    async completeDictationExercise(userId, dictationId) {
        const dictationExercise = await this.getDictation(dictationId);
        if (!dictationExercise) {
            return { status: 404, data: { success: false, message: "Dictation exercise not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedDictation = (userProgress.unlockedDictations || []).some(s => s.toString() == dictationId.toString());
        if (!isUnlockedDictation) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked dictation exercise." } };
        }
        const { nextItem: nextDictationExercise, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: dictationExercise,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextDictation.bind(userProgressService),
            unlockedField: "unlockedDictations"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextDictationExercise ? "Dictation exercise completed. Next dictation exercise unlocked." : "Dictation exercise completed. You have finished all Dictation exercise.",
                userProgress: completedProgress
            }
        };
    }

    async insertDictation(dictationData) {
        const document = DictationExercise.buildDocument(dictationData);
        const result = await this.repository.insert(document);
        await invalidateDictationExerciseCache();
        return { status: 201, data: { success: true, message: "Bài nghe chép chính tả đã được thêm thành công!", result } };
    }

    async updateDictation(id, dictationData) {
        const existing = await this.getDictation(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài nghe chép chính tả không tìm thấy." } };
        }
        const document = DictationExercise.buildDocument(dictationData);
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidateDictationExerciseCache();
        return { status: 200, data: { success: true, message: "Bài nghe chép chính tả đã được cập nhật thành công!", result } };
    }

    async deleteDictation(id) {
        const existing = await this.getDictation(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài nghe chép chính tả không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidateDictationExerciseCache();
        return { status: 200, data: { success: true, message: "Bài nghe chép chính tả đã xóa thành công!" } };
    }
}

module.exports = DictationExerciseService;