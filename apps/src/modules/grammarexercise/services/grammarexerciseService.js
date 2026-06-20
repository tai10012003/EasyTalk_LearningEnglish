const cache = require('../../../shared/utils/cacheService');
const GrammarExerciseRepository = require('../repositories/grammarexerciseRepository');
const { invalidateGrammarExerciseCache } = require('../utils/cacheHelper');
const { GrammarExercise } = require('../models/grammarexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class GrammarExerciseService {
    constructor(repository = new GrammarExerciseRepository()) {
        this.repository = repository;
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getGrammarexerciseList(page = 1, limit = 12, role = "user") {
        const cacheKey = `grammarexercise:list:page=${page}:limit=${limit}:role=${role}`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { grammarexercises: exercises, totalExercises: total };
        });
    }

    async getGrammarexerciseById(id) {
        return await cache.getOrSet(`grammarexercise:item:id=${id}`, 600, async () => {
            return await this.repository.findById(id);
        });
    }

    async getGrammarexerciseBySlug(slug) {
        return await cache.getOrSet(`grammarexercise:item:slug=${slug}`, 600, async () => {
            return await this.repository.findBySlug(slug);
        });
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

    async getGrammarExerciseDetails(userId, grammarExerciseId) {
        const grammarExercise = await this.getGrammarexerciseById(grammarExerciseId);
        if (!grammarExercise) {
            return { status: 404, data: { message: "Grammar exercise not found." } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedGrammarExercise = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarExerciseId.toString());
        if (!isUnlockedGrammarExercise) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked grammar exercise." } };
        }
        return { status: 200, data: { grammarExercise, userProgress } };
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
        await invalidateGrammarExerciseCache();
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
        await invalidateGrammarExerciseCache();
        return { status: 200, data: { success: true, message: "Bài luyện tập ngữ pháp đã được cập nhật thành công !", result } };
    }

    async deleteGrammarexercise(id) {
        const existing = await this.getGrammarexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidateGrammarExerciseCache();
        return { status: 200, data: { success: true, message: "Bài luyện tập ngữ pháp đã xóa thành công !" } };
    }
}

module.exports = GrammarExerciseService;