const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const PronunciationExerciseRepository = require('../repositories/pronunciationexerciseRepository');
const PronunciationExerciseAttemptRepository = require('../repositories/pronunciationexerciseAttemptRepository');
const SpeechAnalysisService = require('./speechAnalysisService');
const { invalidatePronunciationExerciseCache } = require('../utils/cacheHelper');
const { calculateAccuracy } = require('../utils/accuracyCalculator');
const { PronunciationExercise } = require('../models/pronunciationexercise');
const { PronunciationExerciseAttempt } = require('../models/pronunciationexerciseAttempt');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

function normalizeAnswer(text = "") {
    if (typeof text !== "string") return "";
    return text.toLowerCase().replace(/[.,?!;:'"()–—-]/g, "").replace(/\s+/g, " ").trim();
}

function isAnswerCorrect(userAnswer, correctAnswer) {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

function normalizeOptions(options = []) {
    if (!Array.isArray(options)) return [];
    return options.map(option => String(option || "").trim()).filter(Boolean);
}

function buildPronunciationExerciseContent(pronunciationExercise) {
    return {
        title: pronunciationExercise.title,
        slug: pronunciationExercise.slug,
        questions: (pronunciationExercise.questions || []).map(question => ({
            question: question.question,
            type: question.type,
            options: normalizeOptions(question.options),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || ""
        }))
    };
}

function summarizeAttempt(answers = [], totalQuestions = 0) {
    const correctCount = answers.filter(item => item.isCorrect).length;
    const answeredCount = answers.length;
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    return { answeredCount, correctCount, score };
}

class PronunciationExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new PronunciationExerciseRepository();
        this.attemptRepository = options.attemptRepository || new PronunciationExerciseAttemptRepository();
        this.speechAnalysisService = options.speechAnalysisService || new SpeechAnalysisService();
        this.cache = options.cacheService || cache;
        this._userProgressService = options.userProgressService || null;
        this.agentLearningEventService = options.agentLearningEventService || null;
    }

    setAgentLearningEventService(service) {
        this.agentLearningEventService = service;
    }

    getUserProgressService() {
        if (!this._userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this._userProgressService = new UserProgressService();
        }
        return this._userProgressService;
    }

    async getPronunciationexerciseList(page = 1, limit = 12, role = "user") {
        const cacheKey = cacheNs.listKey('pronunciationexercise', { page, limit, role });
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.contentList('pronunciationexercise', role), cacheNs.listTags('pronunciationexercise')), async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { pronunciationexercises: exercises, totalExercises: total };
        });
        if (role !== "admin") {
            return {
                ...result,
                pronunciationexercises: this.sanitizeExercisesForLearner(result.pronunciationexercises)
            };
        }
        return result;
    }

    async getPronunciationexerciseById(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('pronunciationexercise', id), withTags(policies.contentDetail('pronunciationexercise'), cacheNs.itemTags('pronunciationexercise', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getPronunciationexerciseBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('pronunciationexercise', slug), withTags(policies.contentDetail('pronunciationexercise'), cacheNs.itemTags('pronunciationexercise', null, slug)), async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async getPronunciationexerciseByIdOrSlug(identifier) {
        const idOrSlug = String(identifier || "").trim();
        if (!idOrSlug) return null;
        if (/^[a-f\d]{24}$/i.test(idOrSlug)) {
            return await this.getPronunciationexerciseById(idOrSlug);
        }
        return await this.getPronunciationexerciseBySlug(idOrSlug);
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

    sanitizeQuestionForLearner(question, questionIndex) {
        return {
            questionIndex,
            question: question.question,
            type: question.type,
            options: normalizeOptions(question.options)
        };
    }

    sanitizeExerciseForLearner(exercise) {
        if (!exercise) return exercise;
        return {
            ...exercise,
            questions: (exercise.questions || []).map((question, index) => this.sanitizeQuestionForLearner(question, index))
        };
    }

    sanitizeExercisesForLearner(exercises = []) {
        return exercises.map(exercise => this.sanitizeExerciseForLearner(exercise));
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
        return { status: 200, data: { success: true, data: { pronunciationExercise: this.sanitizeExerciseForLearner(pronunciationExercise) } } };
    }

    async getPronunciationexerciseDetailsBySlug(userId, slug) {
        const pronunciationExercise = await this.getPronunciationexerciseBySlug(slug);
        if (!pronunciationExercise) {
            return { status: 404, data: { message: "Pronunciation exercise not found" } };
        }
        return await this.getPronunciationexerciseDetails(userId, pronunciationExercise._id);
    }

    async getPronunciationExerciseRoadmap(userId) {
        const { pronunciationexercises, totalExercises } = await this.getPronunciationexerciseList(1, 10000, "user");
        const userProgress = await this._getOrCreateUserProgress(userId);
        const unlockedIds = new Set((userProgress.unlockedPronunciationExercises || []).map(id => id.toString()));
        const items = pronunciationexercises.map(exercise => {
            const id = exercise._id.toString();
            return {
                _id: exercise._id,
                title: exercise.title,
                slug: exercise.slug,
                sort: exercise.sort,
                questionCount: Array.isArray(exercise.questions) ? exercise.questions.length : 0,
                isUnlocked: unlockedIds.has(id),
                isCurrent: false
            };
        });
        const unlockedCount = items.filter(item => item.isUnlocked).length;
        const currentIndex = items.map(item => item.isUnlocked).lastIndexOf(true);
        if (currentIndex >= 0) {
            items[currentIndex].isCurrent = true;
        }
        return {
            status: 200,
            data: {
                success: true,
                data: {
                    items,
                    progress: {
                        unlockedCount,
                        totalCount: totalExercises,
                        percent: totalExercises > 0 ? Math.round((unlockedCount / totalExercises) * 100) : 0
                    }
                }
            }
        };
    }

    async startAttempt(userId, pronunciationExerciseId) {
        const pronunciationExercise = await this.getPronunciationexerciseById(pronunciationExerciseId);
        if (!pronunciationExercise) {
            return { status: 404, data: { success: false, message: "Pronunciation exercise not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedPronunciationExercise = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == pronunciationExerciseId.toString());
        if (!isUnlockedPronunciationExercise) {
            return { status: 403, data: { success: false, message: "You cannot start a locked pronunciation exercise." } };
        }
        const document = PronunciationExerciseAttempt.buildDocument({
            userId,
            pronunciationExerciseId,
            pronunciationExerciseContent: buildPronunciationExerciseContent(pronunciationExercise)
        });
        const result = await this.attemptRepository.insert(document);
        return {
            status: 201,
            data: {
                success: true,
                attemptId: result.insertedId,
                exerciseId: pronunciationExercise._id,
                pronunciationExerciseId: pronunciationExercise._id,
                status: document.status,
                totalQuestions: document.totalQuestions,
                answeredCount: 0,
                questions: this.sanitizeExerciseForLearner(document.pronunciationExerciseContent).questions,
                startedAt: document.startedAt
            }
        };
    }

    async checkAttemptQuestion(userId, attemptId, questionIndex, answer) {
        const attempt = await this.attemptRepository.findById(attemptId);
        if (!attempt || attempt.userId.toString() !== userId.toString()) {
            return { status: 404, data: { success: false, message: "Attempt not found" } };
        }
        if (attempt.status === "completed") {
            return { status: 400, data: { success: false, message: "Attempt already completed" } };
        }
        const index = Number(questionIndex);
        if (!Number.isInteger(index) || index < 0 || index >= attempt.totalQuestions) {
            return { status: 400, data: { success: false, message: "Invalid question index" } };
        }
        const existingAnswer = (attempt.answers || []).find(item => item.questionIndex === index);
        if (existingAnswer) {
            return {
                status: 200,
                data: {
                    success: true,
                    ...existingAnswer,
                    answeredCount: attempt.answers.length,
                    correctCount: attempt.correctCount || 0,
                    totalQuestions: attempt.totalQuestions
                }
            };
        }
        const question = (attempt.pronunciationExerciseContent?.questions || [])[index];
        if (!question) {
            return { status: 404, data: { success: false, message: "Question not found" } };
        }
        const rawAnswer = String(answer || "").trim();
        if (!rawAnswer) {
            return { status: 400, data: { success: false, message: "Answer is required" } };
        }
        const answerResult = {
            questionIndex: index,
            question: question.question,
            type: question.type,
            options: normalizeOptions(question.options),
            userAnswer: rawAnswer,
            isCorrect: isAnswerCorrect(rawAnswer, question.correctAnswer),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "",
            answeredAt: new Date()
        };
        const answers = [...(attempt.answers || []), answerResult].sort((a, b) => a.questionIndex - b.questionIndex);
        const summary = summarizeAttempt(answers, attempt.totalQuestions);
        await this.attemptRepository.updateAnswer(attempt._id, answers, summary);
        return {
            status: 200,
            data: {
                success: true,
                ...answerResult,
                answeredCount: summary.answeredCount,
                correctCount: summary.correctCount,
                totalQuestions: attempt.totalQuestions
            }
        };
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

    async analyzeAttemptQuestion(audioBuffer, userId, attemptId, questionIndex) {
        if (!audioBuffer) {
            return { status: 400, data: { success: false, message: 'No audio file provided' } };
        }
        const attempt = await this.attemptRepository.findById(attemptId);
        if (!attempt || attempt.userId.toString() !== userId.toString()) {
            return { status: 404, data: { success: false, message: "Attempt not found" } };
        }
        if (attempt.status === "completed") {
            return { status: 400, data: { success: false, message: "Attempt already completed" } };
        }
        const index = Number(questionIndex);
        if (!Number.isInteger(index) || index < 0 || index >= attempt.totalQuestions) {
            return { status: 400, data: { success: false, message: "Invalid question index" } };
        }
        const existingAnswer = (attempt.answers || []).find(item => item.questionIndex === index);
        if (existingAnswer) {
            return {
                status: 200,
                data: {
                    success: true,
                    ...existingAnswer,
                    answeredCount: attempt.answers.length,
                    correctCount: attempt.correctCount || 0,
                    totalQuestions: attempt.totalQuestions
                }
            };
        }
        const question = (attempt.pronunciationExerciseContent?.questions || [])[index];
        if (!question) {
            return { status: 404, data: { success: false, message: "Question not found" } };
        }
        const exerciseForAnalysis = {
            ...attempt.pronunciationExerciseContent,
            _id: attempt.pronunciationExerciseId
        };
        const analysisResult = await this.speechAnalysisService.analyzeWithExercise(audioBuffer, exerciseForAnalysis, index);
        if (!analysisResult.success) {
            return { status: 400, data: { success: false, message: analysisResult.error } };
        }
        const { accuracy, detailedResult } = calculateAccuracy(analysisResult.transcription, analysisResult.correctAnswer);
        const answerResult = {
            questionIndex: index,
            question: question.question,
            type: question.type,
            options: normalizeOptions(question.options),
            userAnswer: analysisResult.transcription || "",
            transcription: analysisResult.transcription || "",
            accuracy,
            detailedResult,
            isCorrect: accuracy >= 50,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "",
            answeredAt: new Date()
        };
        const answers = [...(attempt.answers || []), answerResult].sort((a, b) => a.questionIndex - b.questionIndex);
        const summary = summarizeAttempt(answers, attempt.totalQuestions);
        await this.attemptRepository.updateAnswer(attempt._id, answers, summary);
        await this.recordPronunciationLearningEvent(userId, {
            pronunciationExerciseId: attempt.pronunciationExerciseId,
            questionIndex: index,
            accuracy,
            detailedResult
        });
        return {
            status: 200,
            data: {
                success: true,
                ...answerResult,
                answeredCount: summary.answeredCount,
                correctCount: summary.correctCount,
                totalQuestions: attempt.totalQuestions
            }
        };
    }

    async analyzePronunciation(audioBuffer, pronunciationExerciseIdentifier, questionIndex, userId = null) {
        if (!audioBuffer) {
            return { status: 400, data: { success: false, message: 'No audio file provided' } };
        }
        const pronunciationExercise = await this.getPronunciationexerciseByIdOrSlug(pronunciationExerciseIdentifier);
        if (!pronunciationExercise) {
            return { status: 404, data: { success: false, message: 'Pronunciation exercise not found' } };
        }
        const analysisResult = await this.speechAnalysisService.analyzeWithExercise(audioBuffer, pronunciationExercise, questionIndex);
        if (!analysisResult.success) {
            return { status: 400, data: { success: false, message: analysisResult.error } };
        }
        const { accuracy, detailedResult } = calculateAccuracy(analysisResult.transcription, analysisResult.correctAnswer);
        await this.recordPronunciationLearningEvent(userId, {
            pronunciationExerciseId: pronunciationExercise._id,
            questionIndex,
            accuracy,
            detailedResult
        });
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

    async recordPronunciationLearningEvent(userId, result) {
        if (!userId || !this.agentLearningEventService) return;
        try {
            await this.agentLearningEventService.recordPronunciationAnalysis(userId, {
                exerciseId: result.pronunciationExerciseId,
                questionIndex: result.questionIndex,
                accuracy: result.accuracy,
                detailedResult: result.detailedResult
            });
        } catch (error) {
            console.error("Failed to record pronunciation learning event:", error.message);
        }
    }

    async finishAttempt(userId, attemptId) {
        const attempt = await this.attemptRepository.findById(attemptId);
        if (!attempt || attempt.userId.toString() !== userId.toString()) {
            return { status: 404, data: { success: false, message: "Attempt not found" } };
        }
        if (attempt.status === "completed") {
            const correctCount = attempt.correctCount || attempt.correctAnswers || 0;
            const score = attempt.score ?? attempt.scorePercent ?? (attempt.totalQuestions > 0 ? (correctCount / attempt.totalQuestions) * 100 : 0);
            return {
                status: 200,
                data: {
                    success: true,
                    attemptId: attempt._id,
                    exerciseId: attempt.pronunciationExerciseId,
                    pronunciationExerciseId: attempt.pronunciationExerciseId,
                    status: attempt.status,
                    correctAnswers: correctCount,
                    correctCount,
                    totalQuestions: attempt.totalQuestions,
                    answeredCount: attempt.answeredCount || (attempt.answers || []).length,
                    scorePercent: score,
                    score,
                    answers: attempt.answers || [],
                    startedAt: attempt.startedAt,
                    finishedAt: attempt.completedAt || attempt.finishedAt,
                    completedAt: attempt.completedAt || attempt.finishedAt
                }
            };
        }
        const answers = attempt.answers || [];
        const summary = summarizeAttempt(answers, attempt.totalQuestions);
        await this.attemptRepository.finish(attempt._id, summary);
        const finishedAttempt = await this.attemptRepository.findById(attempt._id);
        return {
            status: 200,
            data: {
                success: true,
                attemptId: finishedAttempt._id,
                exerciseId: finishedAttempt.pronunciationExerciseId,
                pronunciationExerciseId: finishedAttempt.pronunciationExerciseId,
                status: finishedAttempt.status,
                correctAnswers: finishedAttempt.correctCount,
                correctCount: finishedAttempt.correctCount,
                totalQuestions: finishedAttempt.totalQuestions,
                answeredCount: finishedAttempt.answeredCount,
                scorePercent: finishedAttempt.score,
                score: finishedAttempt.score,
                answers: finishedAttempt.answers || [],
                startedAt: finishedAttempt.startedAt,
                finishedAt: finishedAttempt.completedAt,
                completedAt: finishedAttempt.completedAt
            }
        };
    }

    async getAttemptHistory(userId, page = 1, limit = 10) {
        const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
        const normalizedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const { items, total } = await this.attemptRepository.findHistoryByUser(userId, normalizedPage, normalizedLimit);
        const mappedItems = items.map(attempt => ({
            attemptId: attempt._id,
            pronunciationExerciseId: attempt.pronunciationExerciseId,
            title: attempt.pronunciationExerciseContent?.title || "Pronunciation exercise",
            slug: attempt.pronunciationExerciseContent?.slug || "",
            status: attempt.status,
            totalQuestions: attempt.totalQuestions || 0,
            answeredCount: attempt.answeredCount || (attempt.answers || []).length,
            correctCount: attempt.correctCount || attempt.correctAnswers || 0,
            score: attempt.score ?? attempt.scorePercent ?? 0,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt || attempt.finishedAt || null
        }));
        return {
            status: 200,
            data: {
                success: true,
                data: {
                    items: mappedItems,
                    currentPage: normalizedPage,
                    totalPages: Math.ceil(total / normalizedLimit) || 1,
                    totalItems: total
                }
            }
        };
    }

    async getAttemptDetail(userId, attemptId) {
        const attempt = await this.attemptRepository.findById(attemptId);
        if (!attempt || attempt.userId.toString() !== userId.toString()) {
            return { status: 404, data: { success: false, message: "Attempt not found" } };
        }
        const questions = attempt.pronunciationExerciseContent?.questions || [];
        const answersByIndex = new Map((attempt.answers || []).map(answer => [answer.questionIndex, answer]));
        const questionResults = questions.map((question, index) => {
            const answer = answersByIndex.get(index);
            return {
                questionIndex: index,
                question: question.question,
                type: question.type,
                options: normalizeOptions(question.options),
                userAnswer: answer?.userAnswer || answer?.transcription || "",
                transcription: answer?.transcription || "",
                accuracy: answer?.accuracy ?? null,
                detailedResult: answer?.detailedResult || [],
                correctAnswer: answer?.correctAnswer || question.correctAnswer || "",
                explanation: answer?.explanation || question.explanation || "",
                isCorrect: Boolean(answer?.isCorrect),
                answeredAt: answer?.answeredAt || null
            };
        });
        return {
            status: 200,
            data: {
                success: true,
                data: {
                    attemptId: attempt._id,
                    pronunciationExerciseId: attempt.pronunciationExerciseId,
                    pronunciationExerciseContent: {
                        title: attempt.pronunciationExerciseContent?.title || "Pronunciation exercise",
                        slug: attempt.pronunciationExerciseContent?.slug || "",
                        questions
                    },
                    questionResults,
                    status: attempt.status,
                    totalQuestions: attempt.totalQuestions || questions.length,
                    answeredCount: attempt.answeredCount || (attempt.answers || []).length,
                    correctCount: attempt.correctCount || attempt.correctAnswers || 0,
                    score: attempt.score ?? attempt.scorePercent ?? 0,
                    startedAt: attempt.startedAt,
                    completedAt: attempt.completedAt || attempt.finishedAt || null
                }
            }
        };
    }

    async deleteAttemptHistory(userId, attemptId) {
        const result = await this.attemptRepository.deleteById(attemptId, userId);
        if (!result.deletedCount) {
            return { status: 404, data: { success: false, message: "Attempt not found" } };
        }
        return {
            status: 200,
            data: {
                success: true,
                message: "Pronunciation exercise history deleted successfully"
            }
        };
    }

    async insertPronunciationexercise(exerciseData) {
        const document = PronunciationExercise.buildDocument(exerciseData);
        const result = await this.repository.insert(document);
        await invalidatePronunciationExerciseCache({ id: result.insertedId, slug: document.slug });
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
        await invalidatePronunciationExerciseCache({ id, slugs: [existing.slug, document.slug] });
        return { status: 200, data: { message: "Bài luyện tập phát âm đã được cập nhật thành công !", result } };
    }

    async deletePronunciationexercise(id) {
        const existing = await this.getPronunciationexerciseById(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài luyện tập phát âm không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidatePronunciationExerciseCache({ id, slug: existing.slug });
        return { status: 200, data: { success: true, message: "Bài luyện tập phát âm đã xóa thành công !" } };
    }
}

module.exports = PronunciationExerciseService;
