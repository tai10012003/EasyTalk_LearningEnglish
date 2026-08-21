const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const DictationExerciseRepository = require('../repositories/dictationexerciseRepository');
const { invalidateDictationExerciseCache } = require('../utils/cacheHelper');
const DictationExercise = require('../models/dictationexercise');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

function countSentences(content = "") {
    if (typeof content !== "string") return 0;
    return content.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(Boolean).length;
}

class DictationExerciseService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new DictationExerciseRepository();
        this.cache = options.cacheService || cache;
        this.userProgressService = options.userProgressService || null;
        this.agentLearningEventService = options.agentLearningEventService || null;
    }

    setAgentLearningEventService(service) {
        this.agentLearningEventService = service;
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getDictationList(page = 1, limit = 12, role = "user") {
        const cacheKey = cacheNs.listKey('dictation', { page, limit, role });
        return await this.cache.getOrSet(cacheKey, withTags(policies.contentList('dictation', role), cacheNs.listTags('dictation')), async () => {
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            const { dictations, total } = await this.repository.findAll(filter, page, limit);
            return { dictationExercises: dictations, totalDictationExercises: total };
        });
    }

    async getDictation(id) {
        return await this.cache.getOrSet(cacheNs.itemKey('dictation', id), withTags(policies.contentDetail('dictation'), cacheNs.itemTags('dictation', id)), async () => {
            return await this.repository.findById(id);
        });
    }

    async getDictationBySlug(slug) {
        return await this.cache.getOrSet(cacheNs.slugKey('dictation', slug), withTags(policies.contentDetail('dictation'), cacheNs.itemTags('dictation', null, slug)), async () => {
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
        } else if (!Array.isArray(userProgress.unlockedDictations) || userProgress.unlockedDictations.length === 0) {
            const firstDictationExercisePage = await this.getDictationList(1, 1);
            const firstDictationExercise = firstDictationExercisePage?.dictationExercises?.[0] || null;
            if (firstDictationExercise?._id) {
                userProgress.unlockedDictations = [firstDictationExercise._id];
                await userProgressService.updateUserProgress(userProgress);
                userProgress = await userProgressService.getUserProgressByUserId(userId);
            }
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
        return { status: 200, data: { success: true, data: { dictationExercise } } };
    }

    async getDictationExerciseDetailsBySlug(userId, slug) {
        const dictationExercise = await this.getDictationBySlug(slug);
        if (!dictationExercise) {
            return { status: 404, data: { success: false, message: "Dictation exercise not found" } };
        }
        return await this.getDictationExerciseDetails(userId, dictationExercise._id);
    }

    async getDictationExerciseRoadmap(userId) {
        const { dictationExercises, totalDictationExercises } = await this.getDictationList(1, 10000, "user");
        const userProgress = await this._getOrCreateUserProgress(userId);
        const unlockedIds = new Set((userProgress.unlockedDictations || []).map(id => id.toString()));
        const studyStats = userProgress.dictationStudyStats || {};
        const items = dictationExercises.map(dictationExercise => {
            const id = dictationExercise._id.toString();
            const stats = studyStats[id] || {};
            return {
                _id: dictationExercise._id,
                title: dictationExercise.title,
                slug: dictationExercise.slug,
                sort: dictationExercise.sort,
                sentenceCount: countSentences(dictationExercise.content),
                isUnlocked: unlockedIds.has(id),
                isCurrent: false,
                studyCount: stats.studyCount || 0,
                firstStudiedAt: stats.firstStudiedAt || null,
                lastStudiedAt: stats.lastStudiedAt || null
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
                        totalCount: totalDictationExercises,
                        percent: totalDictationExercises > 0 ? Math.round((unlockedCount / totalDictationExercises) * 100) : 0
                    }
                }
            }
        };
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
        await userProgressService.recordDictationStudy(userId, dictationId);
        const latestProgress = await userProgressService.getUserProgressByUserId(userId);
        const dictationStats = latestProgress?.dictationStudyStats?.[dictationId.toString()] || {};
        await this.recordDictationLearningEvent(userId, dictationExercise);
        return {
            status: 200,
            data: {
                success: true,
                message: nextDictationExercise ? "Dictation exercise completed. Next dictation exercise unlocked." : "Dictation exercise completed. You have finished all Dictation exercise.",
                userProgress: latestProgress || completedProgress,
                studyStats: {
                    studyCount: dictationStats.studyCount || 0,
                    firstStudiedAt: dictationStats.firstStudiedAt || null,
                    lastStudiedAt: dictationStats.lastStudiedAt || null
                }
            }
        };
    }

    async recordDictationLearningEvent(userId, dictationExercise) {
        if (!this.agentLearningEventService) return;
        try {
            await this.agentLearningEventService.recordDictationCompletion(userId, {
                exerciseId: dictationExercise._id,
                title: dictationExercise.title
            });
        } catch (error) {
            console.error("Failed to record dictation learning event:", error.message);
        }
    }

    async insertDictation(dictationData) {
        const document = DictationExercise.buildDocument(dictationData);
        const result = await this.repository.insert(document);
        await invalidateDictationExerciseCache({ id: result.insertedId, slug: document.slug });
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
        await invalidateDictationExerciseCache({ id, slugs: [existing.slug, document.slug] });
        return { status: 200, data: { success: true, message: "Bài nghe chép chính tả đã được cập nhật thành công!", result } };
    }

    async deleteDictation(id) {
        const existing = await this.getDictation(id);
        if (!existing) {
            return { status: 404, data: { success: false, message: "Bài nghe chép chính tả không tìm thấy." } };
        }
        await this.repository.delete(id);
        await invalidateDictationExerciseCache({ id, slug: existing.slug });
        return { status: 200, data: { success: true, message: "Bài nghe chép chính tả đã xóa thành công!" } };
    }
}

module.exports = DictationExerciseService;
