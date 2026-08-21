const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const PronunciationService = require('../src/modules/pronunciation/services/pronunciationService');

const passthroughCache = {
    async getOrSet(_key, _policy, fetcher) {
        return await fetcher();
    }
};

test('pronunciation roadmap returns compact items with study counts', async () => {
    const userId = new ObjectId();
    const firstPronunciationId = new ObjectId();
    const secondPronunciationId = new ObjectId();
    const pronunciations = [
        {
            _id: firstPronunciationId,
            title: "Pronunciation 1",
            description: "Short vowels",
            category: "Sounds",
            level: "A1",
            images: "pronunciation-1.png",
            slug: "pronunciation-1",
            sort: 1,
            quizCount: 2
        },
        {
            _id: secondPronunciationId,
            title: "Pronunciation 2",
            description: "Long vowels",
            category: "Sounds",
            level: "A1",
            images: "pronunciation-2.png",
            slug: "pronunciation-2",
            sort: 2,
            quizCount: 1
        }
    ];
    const repository = {
        async findRoadmapItems() {
            return { pronunciations, total: pronunciations.length };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                unlockedPronunciations: [firstPronunciationId],
                pronunciationStudyStats: {
                    [firstPronunciationId.toString()]: {
                        studyCount: 5,
                        firstStudiedAt: new Date("2026-08-18T00:00:00Z"),
                        lastStudiedAt: new Date("2026-08-19T00:00:00Z")
                    }
                }
            };
        }
    };
    const service = new PronunciationService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const roadmap = await service.getPronunciationRoadmap(userId);
    const firstItem = roadmap.data.data.items[0];

    assert.equal(firstItem.isUnlocked, true);
    assert.equal(firstItem.isCurrent, true);
    assert.equal(firstItem.studyCount, 5);
    assert.equal(firstItem.quizCount, 2);
    assert.equal(firstItem.content, undefined);
    assert.equal(firstItem.quizzes, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);
});

test('complete pronunciation increments study count', async () => {
    const userId = new ObjectId();
    const pronunciationId = new ObjectId();
    const pronunciation = {
        _id: pronunciationId,
        title: "Pronunciation 1",
        slug: "pronunciation-1",
        sort: 1,
        content: "Short vowels content",
        quizzes: []
    };
    let studyCount = 0;
    const repository = {
        async findById() {
            return pronunciation;
        },
        async findNextBySortOrder() {
            return null;
        }
    };
    const userProgress = {
        user: userId,
        unlockedPronunciations: [pronunciationId],
        experiencePoints: 0,
        pronunciationStudyStats: {}
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                ...userProgress,
                pronunciationStudyStats: {
                    [pronunciationId.toString()]: {
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
        async unlockNextPronunciation(progress) {
            progress.experiencePoints = (progress.experiencePoints || 0) + 10;
            return progress;
        },
        async recordPronunciationStudy() {
            studyCount += 1;
            return { modifiedCount: 1 };
        }
    };
    const service = new PronunciationService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const result = await service.completePronunciation(userId, pronunciationId);

    assert.equal(result.status, 200);
    assert.equal(studyCount, 1);
    assert.equal(result.data.studyStats.studyCount, 1);
});
