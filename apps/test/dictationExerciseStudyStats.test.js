const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const DictationExerciseService = require('../src/modules/dictationexercise/services/dictationexerciseService');

const passthroughCache = {
    async getOrSet(_key, _policy, fetcher) {
        return await fetcher();
    }
};

test('dictation roadmap returns compact items with study counts', async () => {
    const userId = new ObjectId();
    const firstDictationId = new ObjectId();
    const secondDictationId = new ObjectId();
    const dictations = [
        {
            _id: firstDictationId,
            title: "Dictation 1",
            slug: "dictation-1",
            sort: 1,
            content: "Good morning. How are you?"
        },
        {
            _id: secondDictationId,
            title: "Dictation 2",
            slug: "dictation-2",
            sort: 2,
            content: "Nice to meet you."
        }
    ];
    const repository = {
        async findAll() {
            return { dictations, total: dictations.length };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                unlockedDictations: [firstDictationId],
                dictationStudyStats: {
                    [firstDictationId.toString()]: {
                        studyCount: 2,
                        firstStudiedAt: new Date("2026-08-18T00:00:00Z"),
                        lastStudiedAt: new Date("2026-08-19T00:00:00Z")
                    }
                }
            };
        }
    };
    const service = new DictationExerciseService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const roadmap = await service.getDictationExerciseRoadmap(userId);
    const firstItem = roadmap.data.data.items[0];

    assert.equal(firstItem.isUnlocked, true);
    assert.equal(firstItem.isCurrent, true);
    assert.equal(firstItem.studyCount, 2);
    assert.equal(firstItem.sentenceCount, 2);
    assert.equal(firstItem.content, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);
});

test('complete dictation increments study count without attempt history', async () => {
    const userId = new ObjectId();
    const dictationId = new ObjectId();
    const dictation = {
        _id: dictationId,
        title: "Dictation 1",
        slug: "dictation-1",
        sort: 1,
        content: "Good morning."
    };
    let studyCount = 0;
    const repository = {
        async findById() {
            return dictation;
        },
        async findNextBySortOrder() {
            return null;
        }
    };
    const userProgress = {
        user: userId,
        unlockedDictations: [dictationId],
        experiencePoints: 0,
        dictationStudyStats: {}
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                ...userProgress,
                dictationStudyStats: {
                    [dictationId.toString()]: {
                        studyCount,
                        firstStudiedAt: studyCount > 0 ? new Date("2026-08-20T00:00:00Z") : null,
                        lastStudiedAt: studyCount > 0 ? new Date("2026-08-20T00:00:00Z") : null
                    }
                }
            };
        },
        async updateUserProgress(progress) {
            progress.experiencePoints = (progress.experiencePoints || 0) + 10;
            return { modifiedCount: 1 };
        },
        async unlockNextDictation(progress) {
            progress.experiencePoints = (progress.experiencePoints || 0) + 10;
            return progress;
        },
        async recordDictationStudy() {
            studyCount += 1;
            return { modifiedCount: 1 };
        }
    };
    const service = new DictationExerciseService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const result = await service.completeDictationExercise(userId, dictationId);

    assert.equal(result.status, 200);
    assert.equal(studyCount, 1);
    assert.equal(result.data.studyStats.studyCount, 1);
});
