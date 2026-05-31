const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const VocabularyExerciseRepository = require('../repositories/vocabularyexerciseRepository');
const { invalidateVocabularyExerciseCache } = require('../utils/cacheHelper');
const { VocabularyExercise } = require('../models/vocabularyexercise');

class VocabularyExerciseService {
    constructor() {
        this.repository = new VocabularyExerciseRepository();
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getVocabularyexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `vocabularyexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        const { exercises, total } = await this.repository.findAll(filter, page, limit);
        const result = { vocabularyexercises: exercises, totalExercises: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getVocabularyexerciseById(id) {
        return await this.repository.findById(id);
    }

    async getVocabularyexerciseBySlug(slug) {
        return await this.repository.findBySlug(slug);
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
        const vocabularyExerciseList = await this.getVocabularyexerciseList(1, 10000);
        const vocabularyExercises = vocabularyExerciseList?.vocabularyexercises || [];
        const currentVocabularyExerciseIndex = vocabularyExercises.findIndex(s => s._id.toString() == vocabularyExerciseId.toString());
        let nextVocabularyExercise = null;
        if (currentVocabularyExerciseIndex !== -1 && currentVocabularyExerciseIndex < vocabularyExercises.length - 1) {
            nextVocabularyExercise = vocabularyExercises[currentVocabularyExerciseIndex + 1];
        }
        if (nextVocabularyExercise) {
            userProgress = await userProgressService.unlockNextVocabularyExercise(userProgress, nextVocabularyExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return {
            status: 200,
            data: {
                success: true,
                message: nextVocabularyExercise ? "Vocabulary exercise completed. Next vocabulary exercise unlocked." : "Vocabulary exercise completed. You have finished all vocabulary exercise.",
                userProgress: {
                    unlockedVocabularyExercises: updatedUserProgress.unlockedVocabularyExercises,
                    experiencePoints: updatedUserProgress.experiencePoints,
                    streak: updatedUserProgress.streak,
                    maxStreak: updatedUserProgress.maxStreak,
                    studyDates: updatedUserProgress.studyDates
                }
            }
        };
    }

    async insertVocabularyexercise(exerciseData) {
        const document = VocabularyExercise.buildDocument(exerciseData);
        const result = await this.repository.insert(document);
        await invalidateVocabularyExerciseCache();
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
        await invalidateVocabularyExerciseCache();
        return { status: 200, data: { success: true, message: "Bài luyện tập từ vựng đã được cập nhật thành công !", result } };
    }

    async deleteVocabularyexercise(id) {
        const existing = await this.getVocabularyexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập từ vựng không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidateVocabularyExerciseCache();
        return { status: 200, data: { success: true, message: "Bài luyện tập từ vựng đã xóa thành công !" } };
    }
}

module.exports = VocabularyExerciseService;