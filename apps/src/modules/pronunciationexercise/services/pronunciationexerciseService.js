const cache = require('../../../shared/utils/cacheService');
const PronunciationExerciseRepository = require('../repositories/pronunciationexerciseRepository');
const SpeechAnalysisService = require('./speechAnalysisService');
const { invalidatePronunciationExerciseCache } = require('../utils/cacheHelper');
const { calculateAccuracy } = require('../utils/accuracyCalculator');
const { PronunciationExercise } = require('../models/pronunciationexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class PronunciationExerciseService {
    constructor(repository = new PronunciationExerciseRepository()) {
        this.repository = repository;
        this.speechAnalysisService = new SpeechAnalysisService();
    }

    getUserProgressService() {
        if (!this._userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this._userProgressService = new UserProgressService();
        }
        return this._userProgressService;
    }

    async getPronunciationexerciseList(page = 1, limit = 12, role = "user") {
        const cacheKey = `pronunciationexercise:list:page=${page}:limit=${limit}:role=${role}`;
        const ttl = 300;
        return await cache.getOrSet(cacheKey, ttl, async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { pronunciationexercises: exercises, totalExercises: total };
        });
    }

    async getPronunciationexerciseById(id) {
        return await cache.getOrSet(`pronunciationexercise:item:id=${id}`, 600, async () => {
            return await this.repository.findById(id);
        });
    }

    async getPronunciationexerciseBySlug(slug) {
        return await cache.getOrSet(`pronunciationexercise:item:slug=${slug}`, 600, async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationExercisePage = await this.getPronunciationexerciseList(1, 1);
            const firstPronunciationExercise = firstPronunciationExercisePage?.pronunciationexercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, firstPronunciationExercise?._id || null, null, null);
        }
        return userProgress;
    }

    async getPronunciationexerciseDetails(userId, prouunciationeExerciseId) {
        const pronunciationExercise = await this.getPronunciationexerciseById(prouunciationeExerciseId);
        if (!pronunciationExercise) {
            return { status: 404, data: { message: "Pronunciation exercise not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isPronunciationExerciseUnlocked = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == prouunciationeExerciseId.toString());
        if (!isPronunciationExerciseUnlocked) {
            return { status: 403, data: { success: false, message: "This pronunciation exercise is locked for you. Please complete previous pronunciation exercise first." } };
        }
        return { status: 200, data: { pronunciationExercise, userProgress } };
    }

    async completePronunciationexercise(userId, pronunciationExerciseId) {
        const pronunciationExercise = await this.getPronunciationexerciseById(pronunciationExerciseId);
        if (!pronunciationExercise) {
            return { status: 404, data: { success: false, message: "Pronunciation exercise not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isPronunciationExerciseUnlocked = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == pronunciationExerciseId.toString());
        if (!isPronunciationExerciseUnlocked) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked pronunciation exercise." } };
        }
        const { nextItem: nextPronunciationExercise, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: pronunciationExercise,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextPronunciationExercise.bind(userProgressService),
            unlockedField: "unlockedPronunciationExercises"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextPronunciationExercise ? "Pronunciation exercise completed. Next pronunciation exercise unlocked." : "Pronunciation exercise completed. You have finished all pronunciation exercise.",
                userProgress: completedProgress
            }
        };
    }

    async analyzePronunciation(audioBuffer, pronunciationExerciseId, questionIndex) {
        if (!audioBuffer) {
            return { status: 400, data: { success: false, message: 'No audio file provided' } };
        }
        const pronunciationExercise = await this.getPronunciationexerciseById(pronunciationExerciseId);
        const analysisResult = await this.speechAnalysisService.analyzeWithExercise(audioBuffer, pronunciationExercise, questionIndex);
        if (!analysisResult.success) {
            return { status: 400, data: { success: false, message: analysisResult.error } };
        }
        const { accuracy, detailedResult } = calculateAccuracy(analysisResult.transcription, analysisResult.correctAnswer);
        return {
            status: 200,
            data: {
                success: true,
                transcription: analysisResult.transcription,
                accuracy,
                detailedResult,
                index: questionIndex
            }
        };
    }

    async insertPronunciationexercise(exerciseData) {
        const document = PronunciationExercise.buildDocument(exerciseData);
        const result = await this.repository.insert(document);
        await invalidatePronunciationExerciseCache();
        return { status: 201, data: { success: true, message: "Bài luyện tập phát âm đã được thêm thành công !", result } };
    }

    async updatePronunciationexercise(id, exerciseData) {
        const existing = await this.getPronunciationexerciseById(id);
        if (!existing) {
            return { status: 404, data: { message: "Bài luyện tập phát âm không tìm thấy." } };
        }
        const document = PronunciationExercise.buildDocument(exerciseData);
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidatePronunciationExerciseCache();
        return { status: 200, data: { message: "Bài luyện tập phát âm đã được cập nhật thành công !", result } };
    }

    async deletePronunciationexercise(id) {
        const existing = await this.getPronunciationexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập phát âm không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidatePronunciationExerciseCache();
        return { status: 200, data: { success: true, message: "Bài luyện tập phát âm đã xóa thành công !" } };
    }
}

module.exports = PronunciationExerciseService;