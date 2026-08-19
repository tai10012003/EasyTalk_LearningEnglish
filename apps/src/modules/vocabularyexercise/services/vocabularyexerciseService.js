const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const VocabularyExerciseRepository = require('../repositories/vocabularyexerciseRepository');
const VocabularyExerciseAttemptRepository = require('../repositories/vocabularyexerciseAttemptRepository');
const { invalidateVocabularyExerciseCache } = require('../utils/cacheHelper');
const { VocabularyExercise } = require('../models/vocabularyexercise');
const { VocabularyExerciseAttempt } = require('../models/vocabularyexerciseAttempt');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

function normalizeAnswer(text = "") {
    if (typeof text !== "string") return "";
    return text.toLowerCase().replace(/[.,?!;:'"()–—-]/g, "").replace(/\s+/g, " ").trim();
}

function isAnswerCorrect(userAnswer, correctAnswer) {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

function buildVocabularyExerciseContent(vocabularyExercise) {
    return {
        title: vocabularyExercise.title,
        slug: vocabularyExercise.slug,
        questions: (vocabularyExercise.questions || []).map(question => ({
            question: question.question,
            type: question.type,
            options: Array.isArray(question.options) ? question.options : [],
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

class VocabularyExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new VocabularyExerciseRepository();
        this.attemptRepository = options.attemptRepository || new VocabularyExerciseAttemptRepository();
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
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.contentList('vocabularyexercise', role), cacheNs.listTags('vocabularyexercise')), async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { exercises, total } = await this.repository.findAll(filter, page, limit);
            return { vocabularyexercises: exercises, totalExercises: total };
        });
        if (role !== "admin") {
            return {
                ...result,
                vocabularyexercises: this.sanitizeExercisesForLearner(result.vocabularyexercises)
            };
        }
        return result;
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

    sanitizeQuestionForLearner(question, questionIndex) {
        return {
            questionIndex,
            question: question.question,
            type: question.type,
            options: Array.isArray(question.options) ? question.options : []
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
        return { status: 200, data: { success: true, data: { vocabularyExercise: this.sanitizeExerciseForLearner(vocabularyExercise) } } };
    }

    async getVocabularyExerciseDetailsBySlug(userId, slug) {
        const vocabularyExercise = await this.getVocabularyexerciseBySlug(slug);
        if (!vocabularyExercise) {
            return { status: 404, data: { message: "Vocabulary exercise not found." } };
        }
        return await this.getVocabularyExerciseDetails(userId, vocabularyExercise._id);
    }

    async getVocabularyExerciseRoadmap(userId) {
        const { vocabularyexercises, totalExercises } = await this.getVocabularyexerciseList(1, 10000, "user");
        const userProgress = await this._getOrCreateUserProgress(userId);
        const unlockedIds = new Set((userProgress.unlockedVocabularyExercises || []).map(id => id.toString()));
        const items = vocabularyexercises.map(exercise => {
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

    async startAttempt(userId, vocabularyExerciseId) {
        const vocabularyExercise = await this.getVocabularyexerciseById(vocabularyExerciseId);
        if (!vocabularyExercise) {
            return { status: 404, data: { success: false, message: "Vocabulary exercise not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedVocabularyExercise = (userProgress.unlockedVocabularyExercises || []).some(s => s.toString() == vocabularyExerciseId.toString());
        if (!isUnlockedVocabularyExercise) {
            return { status: 403, data: { success: false, message: "You cannot start a locked vocabulary exercise." } };
        }
        const document = VocabularyExerciseAttempt.buildDocument({
            userId,
            vocabularyExerciseId,
            vocabularyExerciseContent: buildVocabularyExerciseContent(vocabularyExercise)
        });
        const result = await this.attemptRepository.insert(document);
        return {
            status: 201,
            data: {
                success: true,
                attemptId: result.insertedId,
                exerciseId: vocabularyExercise._id,
                vocabularyExerciseId: vocabularyExercise._id,
                status: document.status,
                totalQuestions: document.totalQuestions,
                answeredCount: 0,
                questions: this.sanitizeExerciseForLearner(document.vocabularyExerciseContent).questions,
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
        const question = (attempt.vocabularyExerciseContent?.questions || [])[index];
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
            options: Array.isArray(question.options) ? question.options : [],
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
                    exerciseId: attempt.vocabularyExerciseId,
                    vocabularyExerciseId: attempt.vocabularyExerciseId,
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
                exerciseId: finishedAttempt.vocabularyExerciseId,
                vocabularyExerciseId: finishedAttempt.vocabularyExerciseId,
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
            vocabularyExerciseId: attempt.vocabularyExerciseId,
            title: attempt.vocabularyExerciseContent?.title || "Vocabulary exercise",
            slug: attempt.vocabularyExerciseContent?.slug || "",
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
        const questions = attempt.vocabularyExerciseContent?.questions || [];
        const answersByIndex = new Map((attempt.answers || []).map(answer => [answer.questionIndex, answer]));
        const questionResults = questions.map((question, index) => {
            const answer = answersByIndex.get(index);
            return {
                questionIndex: index,
                question: question.question,
                type: question.type,
                options: Array.isArray(question.options) ? question.options : [],
                userAnswer: answer?.userAnswer || "",
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
                    vocabularyExerciseId: attempt.vocabularyExerciseId,
                    vocabularyExerciseContent: {
                        title: attempt.vocabularyExerciseContent?.title || "Vocabulary exercise",
                        slug: attempt.vocabularyExerciseContent?.slug || "",
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
                message: "Vocabulary exercise history deleted successfully"
            }
        };
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
