const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const StoryService = require('../src/modules/story/services/storyService');

const passthroughCache = {
    async getOrSet(_key, _policy, fetcher) {
        return await fetcher();
    }
};

test('story roadmap returns compact items with study counts', async () => {
    const userId = new ObjectId();
    const firstStoryId = new ObjectId();
    const secondStoryId = new ObjectId();
    const stories = [
        {
            _id: firstStoryId,
            title: "Story 1",
            description: "First story",
            image: "story-1.png",
            level: "A1",
            category: "Daily",
            slug: "story-1",
            sort: 1,
            content: [
                { en: "Good morning.", vi: "Chao buoi sang.", quiz: null },
                { en: "How are you?", vi: "Ban khoe khong?", quiz: { question: "Q", answer: "A" } }
            ]
        },
        {
            _id: secondStoryId,
            title: "Story 2",
            description: "Second story",
            image: "story-2.png",
            level: "A1",
            category: "Daily",
            slug: "story-2",
            sort: 2,
            content: [{ en: "Nice to meet you.", vi: "Rat vui duoc gap ban.", quiz: null }]
        }
    ];
    const repository = {
        async findAll() {
            return { stories, total: stories.length };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                unlockedStories: [firstStoryId],
                storyStudyStats: {
                    [firstStoryId.toString()]: {
                        studyCount: 3,
                        firstStudiedAt: new Date("2026-08-18T00:00:00Z"),
                        lastStudiedAt: new Date("2026-08-19T00:00:00Z")
                    }
                }
            };
        }
    };
    const service = new StoryService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const roadmap = await service.getStoryRoadmap(userId);
    const firstItem = roadmap.data.data.items[0];

    assert.equal(firstItem.isUnlocked, true);
    assert.equal(firstItem.isCurrent, true);
    assert.equal(firstItem.studyCount, 3);
    assert.equal(firstItem.sentenceCount, 2);
    assert.equal(firstItem.quizCount, 1);
    assert.equal(firstItem.content, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);
});

test('complete story increments study count', async () => {
    const userId = new ObjectId();
    const storyId = new ObjectId();
    const story = {
        _id: storyId,
        title: "Story 1",
        slug: "story-1",
        sort: 1,
        content: [{ en: "Good morning.", vi: "Chao buoi sang.", quiz: null }]
    };
    let studyCount = 0;
    const repository = {
        async findById() {
            return story;
        },
        async findNextBySortOrder() {
            return null;
        }
    };
    const userProgress = {
        user: userId,
        unlockedStories: [storyId],
        experiencePoints: 0,
        storyStudyStats: {}
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return {
                ...userProgress,
                storyStudyStats: {
                    [storyId.toString()]: {
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
        async unlockNextStory(progress) {
            progress.experiencePoints = (progress.experiencePoints || 0) + 10;
            return progress;
        },
        async recordStoryStudy() {
            studyCount += 1;
            return { modifiedCount: 1 };
        }
    };
    const service = new StoryService({
        repository,
        userProgressService,
        cacheService: passthroughCache
    });

    const result = await service.completeStory(userId, storyId);

    assert.equal(result.status, 200);
    assert.equal(studyCount, 1);
    assert.equal(result.data.studyStats.studyCount, 1);
});
