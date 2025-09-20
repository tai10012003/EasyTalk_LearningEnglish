const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");
const GrammarService = require('./grammarService');
const StoryService = require('./storyService');
const PronunciationService = require('./pronunciationService');

class UserProgressService {
    databaseConnection = require('./../database/database');
    userprogresses = require('./../models/userprogress');

    client;
    userprogressDatabase;
    userprogressCollection;
    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.userprogressDatabase = this.client.db(config.mongodb.database);
        this.userprogressCollection = this.userprogressDatabase.collection("userprogresses");
    }

    async getLeaderboard(limit = 10) {
        return await this.userprogressCollection.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$user",
                    experiencePoints: { $max: "$experiencePoints" },
                    username: { $first: "$userDetails.username" }
                }
            },
            { $sort: { experiencePoints: -1 } },
            { $limit: limit }
        ]).toArray();
    }

    async createUserProgress(userId, journey = null, initialStory = null, initialGrammar = null, initialPronunciation = null) {
        const grammarService = new GrammarService();
        const storyService = new StoryService();
        const pronunciationService = new PronunciationService();

        const firstGate = journey?.gates?.[0]?._id || null;
        const firstStage = journey?.gates?.[0]?.stages?.[0]?._id || null;

        if (!initialStory || !initialGrammar || !initialPronunciation) {
            const [storyPage, grammarPage, pronPage] = await Promise.all([
                !initialStory ? storyService.getStoryList(1, 1) : null,
                !initialGrammar ? grammarService.getGrammarList(1, 1) : null,
                !initialPronunciation ? pronunciationService.getPronunciationList(1, 1) : null,
            ]);

            if (!initialStory) {
                initialStory = storyPage.stories[0]._id || null;
            }
            if (!initialGrammar) {
                initialGrammar = grammarPage.grammars[0]._id || null;
            }
            if (!initialPronunciation) {
                initialPronunciation = pronPage.pronunciations[0]._id || null;
            }
        }

        const userProgress = {
            user: new ObjectId(userId),
            unlockedGates: firstGate ? [new ObjectId(firstGate)] : [],
            unlockedStages: firstStage ? [new ObjectId(firstStage)] : [],
            unlockedStories: initialStory ? [new ObjectId(initialStory)] : [],
            unlockedGrammars: initialGrammar ? [new ObjectId(initialGrammar)] : [],
            unlockedPronunciations: initialPronunciation ? [new ObjectId(initialPronunciation)] : [],
            experiencePoints: 0,
            streak: 0,
            maxStreak: 0,
            studyDates: [],
        };

        await this.userprogressCollection.insertOne(userProgress);
        return userProgress;
    }

    async getUserProgressByUserId(userId) {
        return await this.userprogressCollection.findOne({ user: new ObjectId(userId) });
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

    async isPronunciationUnlocked(userProgress, PronunciationId) {
        if (!userProgress || !userProgress.unlockedPronunciations) return false;
        return userProgress.unlockedPronunciations.some(s => s.toString() == PronunciationId.toString());
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
        return this.userprogressCollection.updateOne(
            { user: new ObjectId(userProgress.user) },
            {
                $set: {
                    ...normalizedData,
                    experiencePoints: userProgress.experiencePoints || 0,
                    streak,
                    maxStreak,
                    studyDates
                },
            },
            { upsert: true }
        );
    }

    async deleteUserProgress(userId) {
        try {
            const result = await this.userprogressCollection.deleteOne({ user: new ObjectId(userId) });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting user progress:", error);
            throw error;
        }
    }
}

module.exports = UserProgressService;
