const { ObjectId } = require('mongodb');
const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');
const UserProgressRepository = require('../repositories/userprogressRepository');
const { calculateStreak } = require('../utils/streakCalculator');
const { invalidateUserProgressCache } = require('../utils/cacheHelper');
const GrammarService = require('../../grammar/services/grammarService');
const StoryService = require('../../story/services/storyService');
const PronunciationService = require('../../pronunciation/services/pronunciationService');
const GrammarexerciseService = require('../../grammarexercise/services/grammarexerciseService');
const PronunciationexerciseService = require('../../pronunciationexercise/services/pronunciationexerciseService');
const VocabularyexerciseService = require('../../vocabularyexercise/services/vocabularyexerciseService');
const DictationexerciseService = require('../../dictationexercise/services/dictationexerciseService');

class UserProgressService {
    constructor() {
        this.userProgressRepository = new UserProgressRepository();
        this.streakService = null;
        this.badgeService = null;
        this.userPrizeService = null;
        this.followService = null;
        this.leaderboardService = null;
    }

    setStreakService(streakService) {
        this.streakService = streakService;
    }

    setBadgeService(badgeService) {
        this.badgeService = badgeService;
    }

    setUserPrizeService(userPrizeService) {
        this.userPrizeService = userPrizeService;
    }

    setFollowService(followService) {
        this.followService = followService;
    }

    setLeaderboardService(leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    async getUserProgressList(page = 1, limit = 12, search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `userprogress:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error("Cache get error:", err);
        }
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            const db = this.userProgressRepository.db;
            const users = await db.collection("users").find({ username: { $regex: search, $options: "i" } }).project({ _id: 1 }).toArray();
            filter.user = { $in: users.map(u => u._id) };
        }
        const { userprogresses, total } = await this.userProgressRepository.findAll(filter, skip, limit);
        const result = { userprogresses, totalUserProgresses: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
        } catch (err) {
            console.error("Cache set error:", err);
        }

        return result;
    }

    async getUserProgress(id) {
        return await this.userProgressRepository.findUserProgressById(id);
    }

    async getDetailUserProgressByUserId(userId) {
        return await this.userProgressRepository.findDetailUserProgressByUserId(userId);
    }

    async getUserProgressByUserId(userId) {
        return await this.userProgressRepository.findByUserId(userId);
    }

    async createUserProgress(userId, journey = null, initialStory = null, initialGrammar = null, initialPronunciation = null, initialGrammarExercise = null, initialPronunciationExercise = null, initialVocabularyExercise = null, initialDictation = null) {
        const grammarService = new GrammarService();
        const storyService = new StoryService();
        const pronunciationService = new PronunciationService();
        const grammarexerciseService = new GrammarexerciseService();
        const pronunciationexerciseService = new PronunciationexerciseService();
        const vocabularyexerciseService = new VocabularyexerciseService();
        const dictationexerciseService = new DictationexerciseService();
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
                !initialDictation ? dictationexerciseService.getDictationexerciseList(1, 1) : null
            ]);

            initialStory = initialStory || storyPage?.stories?.[0]?._id || null;
            initialGrammar = initialGrammar || grammarPage?.grammars?.[0]?._id || null;
            initialPronunciation = initialPronunciation || pronPage?.pronunciations?.[0]?._id || null;
            initialGrammarExercise = initialGrammarExercise || grammarExPage?.grammarexercises?.[0]?._id || null;
            initialPronunciationExercise = initialPronunciationExercise || pronunciationExPage?.pronunciationexercises?.[0]?._id || null;
            initialVocabularyExercise = initialVocabularyExercise || vocabularyExPage?.vocabularyExercises?.[0]?._id || null;
            initialDictation = initialDictation || dictationPage?.dictationExercises?.[0]?._id || null;
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
            unlockedPrizes: [],
            diamonds: 0,
            streak: 0,
            maxStreak: 0,
            studyDates: [],
        };
        await this.userProgressRepository.insert(userProgress);
        await invalidateUserProgressCache();
        return userProgress;
    }

    async updateUserProgress(userProgress) {
        const normalize = (arr) => Array.isArray(arr) ? [...new Set(arr)].map(id => new ObjectId(id)) : [];
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
        const todayStr = getVietnamDate();
        let studyDates = (userProgress.studyDates || []).map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean);
        if (!studyDates.includes(todayStr)) studyDates.push(todayStr);
        const updateOp = { $set: {}, $inc: {} };
        const currentXP = await this.userProgressRepository.findByUserId(userProgress.user);
        const { currentStreak, tempMaxStreak } = calculateStreak(studyDates, todayStr);
        const maxStreak = Math.max(currentXP?.maxStreak || 0, tempMaxStreak);
        const xpDiff = (userProgress.experiencePoints || 0) - (currentXP?.experiencePoints || 0);
        if (xpDiff > 0) updateOp.$inc.experiencePoints = xpDiff;
        updateOp.$set = { ...normalizedData, streak: currentStreak, maxStreak, studyDates };
        const result = await this.userProgressRepository.update(userProgress.user, updateOp);
        if (this.userPrizeService) {
            await this.userPrizeService.checkAndUnlockNonChampionPrizes(userProgress.user);
        }
        await invalidateUserProgressCache();
        return result;
    }

    async recordStudyTime(userId, seconds) {
        if (!seconds || seconds <= 0) return false;
        const result = await this.userProgressRepository.addDailyStudyTime(userId, seconds);
        await invalidateUserProgressCache();
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    async addDiamonds(userId, amount) {
        if (amount <= 0) return false;
        const result = await this.userProgressRepository.update(userId, {
            $inc: { diamonds: amount }
        });
        await invalidateUserProgressCache();
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    async getDiamonds(userId) {
        const progress = await this.userProgressRepository.findByUserId(userId);
        return progress?.diamonds || 0;
    }

    async deleteUserProgressByUser(userId) {
        const result = await this.userProgressRepository.deleteByUser(userId);
        await invalidateUserProgressCache();
        return result;
    }

    async deleteUserProgress(id) {
        const result = await this.userProgressRepository.deleteProgress(id);
        await invalidateUserProgressCache();
        return result;
    }

    async checkAndResetStreakOnLogin(userId) {
        if (!this.streakService) throw new Error("StreakService chưa được inject!");
        return await this.streakService.checkAndResetStreakOnLogin(userId);
    }

    async checkAndUnlockChampionPrizes(userId) {
        if (!this.userPrizeService) return;
        return await this.userPrizeService.checkAndUnlockChampionPrizes(userId);
    }

    async getLeaderboard(limit = 10) {
        if (!this.leaderboardService) {
            return [];
        }
        return await this.leaderboardService.getLeaderboard(limit);
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

    async isGrammarUnlocked(userProgress, grammarId) {
        if (!userProgress || !userProgress.unlockedGrammars) return false;
        return userProgress.unlockedGrammars.some(s => s.toString() == grammarId.toString());
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

    async isGrammarExerciseUnlocked(userProgress, grammarExerciseId) {
        if (!userProgress || !userProgress.unlockedGrammarExercises) return false;
        return userProgress.unlockedGrammarExercises.some(s => s.toString() == grammarExerciseId.toString());
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

    async isPronunciationExerciseUnlocked(userProgress, pronunciationExerciseId) {
        if (!userProgress || !userProgress.unlockedPronunciationExercises) return false;
        return userProgress.unlockedPronunciationExercises.some(s => s.toString() == pronunciationExerciseId.toString());
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

    async isVocabularyExerciseUnlocked(userProgress, vocabularyExerciseId) {
        if (!userProgress || !userProgress.unlockedVocabularyExercises) return false;
        return userProgress.unlockedVocabularyExercises.some(s => s.toString() == vocabularyExerciseId.toString());
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

    async isDictationUnlocked(userProgress, dictationId) {
        if (!userProgress || !userProgress.unlockedDictations) return false;
        return userProgress.unlockedDictations.some(s => s.toString() == dictationId.toString());
    }
}

module.exports = UserProgressService;