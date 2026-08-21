const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const FlashcardService = require('../src/modules/flashcard/services/flashcardService');
const UserProgressService = require('../src/modules/userprogress/services/userprogressService');
const { getVietnamDate } = require('../src/shared/utils/dateFormat');

test('flashcard list uses precomputed list stats without per-list queries', async () => {
    const userId = new ObjectId();
    const listId = new ObjectId();
    let wordCountCalls = 0;
    const repository = {
        async findFlashcardLists() {
            return {
                flashcardLists: [
                    {
                        _id: listId,
                        name: "My words",
                        user: userId,
                        wordCount: 12,
                        remembered: 4,
                        toReview: 8
                    }
                ],
                totalFlashcardLists: 1
            };
        },
        async getWordCountForList() {
            wordCountCalls += 1;
            return 999;
        }
    };
    const service = new FlashcardService({ repository, imageService: {} });

    const result = await service.getFlashcardList(1, 3, "mine", userId.toString());

    assert.equal(result.flashcardLists[0].wordCount, 12);
    assert.equal(result.flashcardLists[0].remembered, 4);
    assert.equal(result.flashcardLists[0].toReview, 8);
    assert.equal(wordCountCalls, 0);
});

test('flashcard progress overview returns daily reviews goal and badges from one progress document', async () => {
    const userId = new ObjectId();
    const today = getVietnamDate();
    const monthYear = today.slice(0, 7);
    const otherDayThisMonth = today.endsWith("-01") ? `${monthYear}-02` : `${monthYear}-01`;
    let findCalls = 0;
    const repository = {
        async findByUserId() {
            findCalls += 1;
            return {
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: {
                    [otherDayThisMonth]: 7,
                    [today]: 25,
                    "2000-01-01": 100
                },
                unlockedFlashcardBadges: {}
            };
        }
    };
    const service = new UserProgressService({ repository });

    const overview = await service.getFlashcardProgressOverview(userId);

    assert.equal(findCalls, 1);
    assert.equal(overview.dailyGoal.goal, 20);
    assert.equal(overview.dailyGoal.isAchieved, true);
    assert.equal(overview.badges.monthlyTotal, 32);
    assert.equal(overview.dailyFlashcardReviews[today], 25);
});
