const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const GrammarService = require('../src/modules/grammar/services/grammarService');

const passthroughCache = {
    async getOrSet(_key, _policy, fetcher) {
        return await fetcher();
    }
};

test('grammar roadmap returns compact items with study counts', async () => {
    const userId = new ObjectId();
    const firstGrammarId = new ObjectId();
    const secondGrammarId = new ObjectId();
    const grammars = [
        {
            _id: firstGrammarId,
            title: "Grammar 1",
            description: "Present simple",
            category: "Tenses",
            level: "A1",
            images: "grammar-1.png",
            slug: "grammar-1",
            sort: 1,
            quizCount: 2
        },
        {
            _id: secondGrammarId,
            title: "Grammar 2",
            description: "Past simple",
            category: "Tenses",
            level: "A1",
            images: "grammar-2.png",
            slug: "grammar-2",
            sort: 2,
            quizCount: 1
        }
    ];
    const repository = {
        async findRoadmapItems() {
            return { grammars, total: grammars.length };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                unlockedGrammars: [firstGrammarId],
                grammarStudyStats: {
                    [firstGrammarId.toString()]: {
                        studyCount: 4,
                        firstStudiedAt: new Date("2026-08-18T00:00:00Z"),
                        lastStudiedAt: new Date("2026-08-19T00:00:00Z")
                    }
                }
            };
        }
    };
    const service = new GrammarService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const roadmap = await service.getGrammarRoadmap(userId);
    const firstItem = roadmap.data.data.items[0];

    assert.equal(firstItem.isUnlocked, true);
    assert.equal(firstItem.isCurrent, true);
    assert.equal(firstItem.studyCount, 4);
    assert.equal(firstItem.quizCount, 2);
    assert.equal(firstItem.content, undefined);
    assert.equal(firstItem.quizzes, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);
});

test('complete grammar increments study count', async () => {
    const userId = new ObjectId();
    const grammarId = new ObjectId();
    const grammar = {
        _id: grammarId,
        title: "Grammar 1",
        slug: "grammar-1",
        sort: 1,
        content: "Present simple content",
        quizzes: []
    };
    let studyCount = 0;
    const repository = {
        async findById() {
            return grammar;
        },
        async findNextBySortOrder() {
            return null;
        }
    };
    const userProgress = {
        user: userId,
        unlockedGrammars: [grammarId],
        experiencePoints: 0,
        grammarStudyStats: {}
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                ...userProgress,
                grammarStudyStats: {
                    [grammarId.toString()]: {
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
        async unlockNextGrammar(progress) {
            progress.experiencePoints = (progress.experiencePoints || 0) + 10;
            return progress;
        },
        async recordGrammarStudy() {
            studyCount += 1;
            return { modifiedCount: 1 };
        }
    };
    const service = new GrammarService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const result = await service.completeGrammar(userId, grammarId);

    assert.equal(result.status, 200);
    assert.equal(studyCount, 1);
    assert.equal(result.data.studyStats.studyCount, 1);
});
