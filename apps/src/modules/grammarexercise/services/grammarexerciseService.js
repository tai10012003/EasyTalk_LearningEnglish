const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const GrammarExerciseRepository = require('../repositories/grammarexerciseRepository');
const GrammarExerciseAttemptRepository = require('../repositories/grammarexerciseAttemptRepository');
const { invalidateGrammarExerciseCache } = require('../utils/cacheHelper');
const { GrammarExercise } = require('../models/grammarexercise');
const { GrammarExerciseAttempt } = require('../models/grammarexerciseAttempt');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

function normalizeAnswer(text = "") {
    if (typeof text !== "string") return "";
    return text
        .toLowerCase()
        .replace(/[.,?!;:'"()–—-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function isAnswerCorrect(userAnswer, correctAnswer) {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

function buildGrammarExerciseContent(grammarExercise) {
    return {
        title: grammarExercise.title,
        slug: grammarExercise.slug,
        questions: (grammarExercise.questions || []).map(question => ({
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

class GrammarExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new GrammarExerciseRepository();
        this.attemptRepository = options.attemptRepository || new GrammarExerciseAttemptRepository();
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
                grammarexercises: this.sanitizeExercisesForLearner(await this.englishTranslationService.applyTranslations("grammarExercise", result.grammarexercises, lang))
            };
        }
        if (role !== "admin") {
            return {
                ...result,
                grammarexercises: this.sanitizeExercisesForLearner(result.grammarexercises)
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
        return { status: 200, data: { success: true, data: { grammarExercise: this.sanitizeExerciseForLearner(localizedGrammarExercise) } } };
    }

    async getGrammarExerciseDetailsBySlug(userId, slug, lang = "vi") {
        const grammarExercise = await this.getGrammarexerciseBySlug(slug);
        if (!grammarExercise) {
            return { status: 404, data: { message: "Grammar exercise not found." } };
        }
        return await this.getGrammarExerciseDetails(userId, grammarExercise._id, lang);
    }

    async getGrammarExerciseRoadmap(userId, lang = "vi") {
        const { grammarexercises, totalExercises } = await this.getGrammarexerciseList(1, 10000, "user", lang);
        const userProgress = await this._getOrCreateUserProgress(userId);
        const unlockedIds = new Set((userProgress.unlockedGrammarExercises || []).map(id => id.toString()));
        const items = grammarexercises.map(exercise => {
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

    async startAttempt(userId, grammarExerciseId) {
        const grammarExercise = await this.getGrammarexerciseById(grammarExerciseId);
        if (!grammarExercise) {
            return { status: 404, data: { success: false, message: "Grammar exercise not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlockedGrammarExercise = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarExerciseId.toString());
        if (!isUnlockedGrammarExercise) {
            return { status: 403, data: { success: false, message: "You cannot start a locked grammar exercise." } };
        }
        const document = GrammarExerciseAttempt.buildDocument({
            userId,
            grammarExerciseId,
            grammarExerciseContent: buildGrammarExerciseContent(grammarExercise)
        });
        const result = await this.attemptRepository.insert(document);
        return {
            status: 201,
            data: {
                success: true,
                attemptId: result.insertedId,
                exerciseId: grammarExercise._id,
                grammarExerciseId: grammarExercise._id,
                status: document.status,
                totalQuestions: document.totalQuestions,
                answeredCount: 0,
                questions: this.sanitizeExerciseForLearner(document.grammarExerciseContent).questions,
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
                    totalQuestions: attempt.totalQuestions
                }
            };
        }
        const question = (attempt.grammarExerciseContent?.questions || [])[index];
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
            return {
                status: 200,
                data: {
                    success: true,
                    attemptId: attempt._id,
                    exerciseId: attempt.grammarExerciseId,
                    grammarExerciseId: attempt.grammarExerciseId,
                    status: attempt.status,
                    correctAnswers: attempt.correctCount || attempt.correctAnswers || 0,
                    correctCount: attempt.correctCount || attempt.correctAnswers || 0,
                    totalQuestions: attempt.totalQuestions,
                    answeredCount: attempt.answeredCount || (attempt.answers || []).length,
                    scorePercent: attempt.score ?? (attempt.totalQuestions > 0 ? ((attempt.correctCount || attempt.correctAnswers || 0) / attempt.totalQuestions) * 100 : 0),
                    score: attempt.score ?? (attempt.totalQuestions > 0 ? ((attempt.correctCount || attempt.correctAnswers || 0) / attempt.totalQuestions) * 100 : 0),
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
                exerciseId: finishedAttempt.grammarExerciseId,
                grammarExerciseId: finishedAttempt.grammarExerciseId,
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
            grammarExerciseId: attempt.grammarExerciseId,
            title: attempt.grammarExerciseContent?.title || "Grammar exercise",
            slug: attempt.grammarExerciseContent?.slug || "",
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
        const questions = attempt.grammarExerciseContent?.questions || [];
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
                    grammarExerciseId: attempt.grammarExerciseId,
                    grammarExerciseContent: {
                        title: attempt.grammarExerciseContent?.title || "Grammar exercise",
                        slug: attempt.grammarExerciseContent?.slug || "",
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
                message: "Grammar exercise history deleted successfully"
            }
        };
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
