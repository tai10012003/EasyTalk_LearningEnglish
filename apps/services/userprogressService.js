const { ObjectId } = require('mongodb');
const { getRedisClient } = require("../util/redisClient");
const GrammarService = require('./grammarService');
const StoryService = require('./storyService');
const PronunciationService = require('./pronunciationService');
const GrammarexerciseService= require('./grammarexerciseService');
const PronunciationexerciseService= require('./pronunciationexerciseService');
const VocabularyexerciseService= require('./vocabularyexerciseService');
const DictationService= require('./dictationService');
const { UserprogressRepository } = require('./../repositories');

const BADGES = [
    { name: "Tân binh chăm chỉ", threshold: 1000, xp: 300 },
    { name: "Chiến binh ngôn từ", threshold: 3000, xp: 900 },
    { name: "Bậc thầy từ vựng", threshold: 6000, xp: 2500 },
    { name: "Huyền thoại ôn tập", threshold: 10000, xp: 5000 },
    { name: "Vua từ vựng", threshold: 15000, xp: 9000 },
];

class UserprogressService {
    constructor() {
        this.userprogressRepository = new UserprogressRepository();
    }

    async getUserProgressList(page = 1, limit = 12, search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `userprogress:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error("Cache get error:", err);
        }
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            const db = this.userprogressRepository.db;
            const users = await db.collection("users").find({ username: { $regex: search, $options: "i" } }).project({ _id: 1 }).toArray();
            const userIds = users.map((u) => u._id);
            filter.user = { $in: userIds };
        }
        const { userprogresses, total } = await this.userprogressRepository.findAll(filter, skip, limit);
        const result = { userprogresses, totalUserProgresses: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error("Cache set error:", err);
        }
        return result;
    }

    async getUserProgress(id) {
        return await this.userprogressRepository.findUserProgressById(id);
    }

    async getLeaderboard(type = 'exp', period = 'all', limit = 50) {
        if (type == 'exp') {
            return await this.userprogressRepository.getLeaderboardByExp(period, limit);
        } else if (type == 'time') {
            return await this.userprogressRepository.getLeaderboardByStudyTime(period, limit);
        } else if (type == 'streak') {
            return await this.userprogressRepository.getLeaderboardByStreak(limit);
        }
    }

    async getUserStatistics(userId, type = 'time', period = 'week') {
        return await this.userprogressRepository.getUserStatistics(userId, type, period);
    }

    async getDailyFlashcardGoal(userId) {
        return await this.userprogressRepository.getDailyGoal(userId);
    }

    async updateDailyFlashcardGoal(userId, goal) {
        if (goal < 0 || goal > 200) throw new Error("Goal must be between 0 and 200");
        const result = await this.userprogressRepository.updateDailyGoal(userId, goal);
        await this._invalidateCache();
        return result;
    }

    async getMonthlyBadgesStatus(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userprogressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlocked = await this.userprogressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        const status = BADGES.map(b => ({
            ...b,
            unlocked: unlocked.includes(b.name) || monthlyTotal >= b.threshold
        }));
        return { monthYear, monthlyTotal, status };
    }

    async incrementDailyFlashcardReview(userId, count = 1) {
        const todayStr = getVietnamDate();
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) throw new Error("User progress not found");
        const goal = userProgress?.dailyFlashcardGoal || 20;
        const prevTodayCount = userProgress?.dailyFlashcardReviews?.[todayStr] || 0;
        const todayCount = prevTodayCount + count;
        const updateOp = { $inc: { [`dailyFlashcardReviews.${todayStr}`]: count } };
        let expBonus = 0;
        const expFromGoal = this._calculateExpBonus(goal, prevTodayCount, todayCount);
        if (expFromGoal > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + expFromGoal;
            expBonus += expFromGoal;
        }
        const badgeResult = await this._handleBadgeUnlock(userId);
        if (badgeResult.totalXp > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + badgeResult.totalXp;
            expBonus += badgeResult.totalXp;
        }
        const result = await this.userprogressRepository.update(userId, updateOp, true);
        await this._invalidateCache();
        return {
            ...result,
            expBonus,
            todayCount,
            monthlyTotal: badgeResult.monthlyTotal,
            unlockedBadges: badgeResult.unlockedBadges,
        };
    }

    _calculateExpBonus(goal, prevCount, newCount) {
        if (newCount >= goal && prevCount < goal) {
            if (goal <= 20) return 10;
            if (goal <= 70) return 20;
            if (goal <= 130) return 30;
            return 50;
        }
        return 0;
    }

    async _handleBadgeUnlock(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userprogressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlockedBadges = await this.userprogressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        let totalXp = 0;
        const newlyUnlocked = [];
        for (const badge of BADGES) {
            if (monthlyTotal >= badge.threshold && !unlockedBadges.includes(badge.name)) {
                await this.userprogressRepository.unlockBadge(userId, monthYear, badge.name);
                totalXp += badge.xp;
                newlyUnlocked.push(badge.name);
            }
        }
        return { monthlyTotal, totalXp, unlockedBadges: newlyUnlocked };
    }

    async createUserProgress(userId, journey = null, initialStory = null, initialGrammar = null, initialPronunciation = null, initialGrammarExercise = null, initialPronunciationExercise = null, initialVocabularyExercise = null, initialDictation = null) {
        const grammarService = new GrammarService();
        const storyService = new StoryService();
        const pronunciationService = new PronunciationService();
        const grammarexerciseService = new GrammarexerciseService();
        const pronunciationexerciseService = new PronunciationexerciseService();
        const vocabularyexerciseService = new VocabularyexerciseService();
        const dictationService = new DictationService();
        const firstGate = journey?.gates?.[0]?._id || null;
        const firstStage = journey?.gates?.[0]?.stages?.[0]?._id || null;
        if (!initialStory || !initialGrammar || !initialPronunciation || !initialGrammarExercise || !initialPronunciationExercise || !initialVocabularyExercise || !initialDictation) {
            const [storyPage, grammarPage, pronPage, grammarExPage, pronunciationExPage, vocabularyExPage, dictationPage] = await Promise.all([
                !initialStory ? storyService.getStoryList(1, 1) : null,
                !initialGrammar ? grammarService.getGrammarList(1, 1) : null,
                !initialPronunciation ? pronunciationService.getPronunciationList(1, 1) : null,
                !initialGrammarExercise ? grammarexerciseService.getGrammarexerciseList(1, 1) : null,
                !initialPronunciationExercise ? pronunciationexerciseService.getPronunciationexerciseList(1, 1) : null,
                !initialVocabularyExercise ? vocabularyexerciseService.getVocabularyExerciseList(1, 1) : null,
                !initialDictation ? dictationService.getDictationList(1, 1) : null
            ]);
            if (!initialStory) initialStory = storyPage.stories[0]._id || null;
            if (!initialGrammar) initialGrammar = grammarPage.grammars[0]._id || null;
            if (!initialPronunciation) initialPronunciation = pronPage.pronunciations[0]._id || null;
            if (!initialGrammarExercise) initialGrammarExercise = grammarExPage.grammarexercises[0]._id || null;
            if (!initialPronunciationExercise) initialPronunciationExercise = pronunciationExPage.pronunciationexercises[0]._id || null;
            if (!initialVocabularyExercise) initialVocabularyExercise = vocabularyExPage.vocabularyExercises[0]._id || null;
            if (!initialDictation) initialDictation = dictationPage.dictationExercises[0]._id || null;
        }
        const userProgress = {
            user: new ObjectId(userId),
            dailyFlashcardReviews: {},
            dailyFlashcardGoal: 20,
            unlockedFlashcardBadges: {},
            unlockedGates: firstGate ? [new ObjectId(firstGate)] : [],
            unlockedStages: firstStage ? [new ObjectId(firstStage)] : [],
            unlockedStories: initialStory ? [new ObjectId(initialStory)] : [],
            unlockedGrammars: initialGrammar ? [new ObjectId(initialGrammar)] : [],
            unlockedPronunciations: initialPronunciation ? [new ObjectId(initialPronunciation)] : [],
            unlockedGrammarExercises: initialGrammarExercise ? [new ObjectId(initialGrammarExercise)] : [],
            unlockedPronunciationExercises: initialPronunciationExercise ? [new ObjectId(initialPronunciationExercise)] : [],
            unlockedVocabularyExercises: initialVocabularyExercise ? [new ObjectId(initialVocabularyExercise)] : [],
            unlockedDictations: initialDictation ? [new ObjectId(initialDictation)] : [],
            studyTimes: 0,
            dailyStudyTimes: {},
            experiencePoints: 0,
            dailyExperiencePoints: {},
            streak: 0,
            maxStreak: 0,
            studyDates: [],
        };
        await this.userprogressRepository.insert(userProgress);
        await this._invalidateCache();
        return userProgress;
    }

    async getUserProgressByUserId(userId) {
        return await this.userprogressRepository.findByUserId(userId);
    }

    async updateUserProgress(userProgress) {
        const normalize = (arr) =>
            Array.isArray(arr) ? [...new Set(arr)].map(id => new ObjectId(id)) : [];
        const fields = [
            "unlockedGates",
            "unlockedStages",
            "unlockedStories",
            "unlockedGrammars",
            "unlockedPronunciations",
            "unlockedGrammarExercises",
            "unlockedPronunciationExercises",
            "unlockedVocabularyExercises",
            "unlockedDictations",
        ];
        const normalizedData = Object.fromEntries(
            fields.map(field => [field, normalize(userProgress[field])])
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
        if (!userProgress.studyDates) userProgress.studyDates = [];
        let studyDates = userProgress.studyDates.map(d => {
            if (d instanceof Date) return d.toISOString().split('T')[0];
            return d;
        });
        if (!studyDates.includes(todayStr)) studyDates.push(todayStr);
        studyDates.sort();
        let streak = 1;
        let maxStreak = userProgress.maxStreak || 1;
        for (let i = 1; i < studyDates.length; i++) {
            const diff = (new Date(studyDates[i]) - new Date(studyDates[i - 1])) / (1000 * 60 * 60 * 24);
            if (diff == 1) {
                streak++;
            } else if (diff == 2) {
                streak = 0;
                studyDates = [];
            } else if (diff > 2) {
                streak = 1;
            }
        }
        if (streak > maxStreak) maxStreak = streak;
        const updateOp = { $set: {}, $inc: {} };
        const currentXP = await this.userprogressRepository.findByUserId(userProgress.user);
        const xpDiff = (userProgress.experiencePoints || 0) - (currentXP?.experiencePoints || 0);
        if (xpDiff > 0) {
            updateOp.$inc.experiencePoints = xpDiff;
        }
        updateOp.$set = {
            ...normalizedData,
            streak,
            maxStreak,
            studyDates
        };
        const result = await this.userprogressRepository.update(userProgress.user, updateOp);
        await this._invalidateCache();
        return result;
    }

    async recordStudyTime(userId, seconds) {
        if (!seconds || seconds <= 0) return false;
        const result = await this.userprogressRepository.addDailyStudyTime(userId, seconds);
        await this._invalidateCache();
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    async deleteUserProgressByUser(userId) {
        const result = await this.userprogressRepository.deleteByUser(userId);
        await this._invalidateCache();
        return result;
    }

    async deleteUserProgress(id) {
        const result = await this.userprogressRepository.deleteProgress(id);
        await this._invalidateCache();
        return result;
    }

    async unlockJourneyInitial(userProgress, journey) {
        const firstGate = journey.gates && journey.gates.length > 0 ? journey.gates[0]._id : null;
        const firstStage = journey.gates[0]?.stages && journey.gates[0].stages.length > 0 ? journey.gates[0].stages[0]._id : null;
        let isUpdated = false;
        if (firstGate && !userProgress.unlockedGates.some(g => g.toString() == firstGate.toString())) {
            userProgress.unlockedGates.push(firstGate);
            isUpdated = true;
        }
        if (firstStage && !userProgress.unlockedStages.some(s => s.toString() == firstStage.toString())) {
            userProgress.unlockedStages.push(firstStage);
            isUpdated = true;
        }
        if (isUpdated) {
            await this.updateUserProgress(userProgress);
        }
        return userProgress;
    }

    async unlockNextStory(userProgress, nextStoryId, addExp = 10) {
        if (!nextStoryId) return userProgress;
        if (!userProgress.unlockedStories) userProgress.unlockedStories = [];
        const nextIdStr = nextStoryId.toString();
        if (!userProgress.unlockedStories.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedStories.push(new ObjectId(nextStoryId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isStoryUnlocked(userProgress, storyId) {
        if (!userProgress || !userProgress.unlockedStories) return false;
        return userProgress.unlockedStories.some(s => s.toString() == storyId.toString());
    }

    async unlockNextGrammar(userProgress, nextGrammarId, addExp = 10) {
        if (!nextGrammarId) return userProgress;
        if (!userProgress.unlockedGrammars) userProgress.unlockedGrammars = [];
        const nextIdStr = nextGrammarId.toString();
        if (!userProgress.unlockedGrammars.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedGrammars.push(new ObjectId(nextGrammarId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isGrammarUnlocked(userProgress, GrammarId) {
        if (!userProgress || !userProgress.unlockedGrammars) return false;
        return userProgress.unlockedGrammars.some(s => s.toString() == GrammarId.toString());
    }

    async unlockNextPronunciation(userProgress, nextPronunciationId, addExp = 10) {
        if (!nextPronunciationId) return userProgress;
        if (!userProgress.unlockedPronunciations) userProgress.unlockedPronunciations = [];
        const nextIdStr = nextPronunciationId.toString();
        if (!userProgress.unlockedPronunciations.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedPronunciations.push(new ObjectId(nextPronunciationId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async unlockNextGrammarExercise(userProgress, nextGrammarExerciseId, addExp = 10) {
        if (!nextGrammarExerciseId) return userProgress;
        if (!userProgress.unlockedGrammarExercises) userProgress.unlockedGrammarExercises = [];
        const nextIdStr = nextGrammarExerciseId.toString();
        if (!userProgress.unlockedGrammarExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedGrammarExercises.push(new ObjectId(nextGrammarExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isGrammarExerciseUnlocked(userProgress, GrammarExerciseId) {
        if (!userProgress || !userProgress.unlockedGrammarExercises) return false;
        return userProgress.unlockedGrammarExercises.some(s => s.toString() == GrammarExerciseId.toString());
    }

    async unlockNextPronunciationExercise(userProgress, nextPronunciationExerciseId, addExp = 10) {
        if (!nextPronunciationExerciseId) return userProgress;
        if (!userProgress.unlockedPronunciationExercises) userProgress.unlockedPronunciationExercises = [];
        const nextIdStr = nextPronunciationExerciseId.toString();
        if (!userProgress.unlockedPronunciationExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedPronunciationExercises.push(new ObjectId(nextPronunciationExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isPronunciationExerciseUnlocked(userProgress, PronunciationExerciseId) {
        if (!userProgress || !userProgress.unlockedPronunciationExercises) return false;
        return userProgress.unlockedPronunciationExercises.some(s => s.toString() == PronunciationExerciseId.toString());
    }

    async unlockNextVocabularyExercise(userProgress, nextVocabularyExerciseId, addExp = 10) {
        if (!nextVocabularyExerciseId) return userProgress;
        if (!userProgress.unlockedVocabularyExercises) userProgress.unlockedVocabularyExercises = [];
        const nextIdStr = nextVocabularyExerciseId.toString();
        if (!userProgress.unlockedVocabularyExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedVocabularyExercises.push(new ObjectId(nextVocabularyExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isVocabularyExerciseUnlocked(userProgress, VocabularyExerciseId) {
        if (!userProgress || !userProgress.unlockedVocabularyExercises) return false;
        return userProgress.unlockedVocabularyExercises.some(s => s.toString() == VocabularyExerciseId.toString());
    }

    async unlockNextDictation(userProgress, nextDictationId, addExp = 10) {
        if (!nextDictationId) return userProgress;
        if (!userProgress.unlockedDictations) userProgress.unlockedDictations = [];
        const nextIdStr = nextDictationId.toString();
        if (!userProgress.unlockedDictations.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedDictations.push(new ObjectId(nextDictationId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isDictationUnlocked(userProgress, DictationId) {
        if (!userProgress || !userProgress.unlockedDictations) return false;
        return userProgress.unlockedDictations.some(s => s.toString() == DictationId.toString());
    }

    async _invalidateCache() {
        const redis = getRedisClient();
        const scanAndDelete = async (pattern) => {
            let cursor = '0';
            let totalDeleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                if (keys.length > 0) {
                    const deleted = await redis.del(keys);
                    totalDeleted += deleted;
                }
                cursor = nextCursor;
            } while (cursor !== '0');
            return totalDeleted;
        };
        try {
            const deletedList = await scanAndDelete('userprogress:list:*');
            const deletedApi = await scanAndDelete('cache:/api/userprogress*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`UserProgress cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No userprogress cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate userprogress cache error:', err);
        }
    }
}

module.exports = UserprogressService;