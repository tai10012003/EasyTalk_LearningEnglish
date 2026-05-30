const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const GrammarExerciseRepository = require('../repositories/grammarexerciseRepository');
const { invalidateGrammarExerciseCache } = require('../utils/cacheHelper');
const { GrammarExercise } = require('../models/grammarexercise');

class GrammarExerciseService {
    constructor() {
        this.repository = new GrammarExerciseRepository();
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getGrammarexerciseList(page = 1, limit = 12, role = "user") {
        const redis = getRedisClient();
        const cacheKey = `grammarexercise:list:page=${page}:limit=${limit}:role=${role}`;
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
        const result = { grammarexercises: exercises, totalExercises: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
    }

    async getGrammarexerciseById(id) {
        return await this.repository.findById(id);
    }

    async getGrammarexerciseBySlug(slug) {
        return await this.repository.findBySlug(slug);
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
        const grammarExerciseList = await this.getGrammarexerciseList(1, 10000);
        const grammarExercises = grammarExerciseList?.grammarexercises || [];
        const currentGrammarExerciseIndex = grammarExercises.findIndex(s => s._id.toString() == grammarExerciseId.toString());
        let nextGrammarExercise = null;
        if (currentGrammarExerciseIndex !== -1 && currentGrammarExerciseIndex < grammarExercises.length - 1) {
            nextGrammarExercise = grammarExercises[currentGrammarExerciseIndex + 1];
        }
        if (nextGrammarExercise) {
            userProgress = await userProgressService.unlockNextGrammarExercise(userProgress, nextGrammarExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return {
            status: 200,
            data: {
                success: true,
                message: nextGrammarExercise ? "Grammar exercise completed. Next grammar exercise unlocked." : "Grammar exercise completed. You have finished all grammar exercise.",
                userProgress: {
                    unlockedGrammarExercises: updatedUserProgress.unlockedGrammarExercises,
                    experiencePoints: updatedUserProgress.experiencePoints,
                    streak: updatedUserProgress.streak,
                    maxStreak: updatedUserProgress.maxStreak,
                    studyDates: updatedUserProgress.studyDates
                }
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