const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('../config/setting');
const { getVietnamDate } = require('../util/dateFormat');

class UserprogressRepository {
    client;
    db;
    collection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("userprogresses");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const cursor = await this.collection.aggregate([
            { $match: filter },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    dailyFlashcardGoal: 1,
                    experiencePoints: 1,
                    streak: 1,
                    maxStreak: 1,
                    dailyFlashcardReviews: 1,
                    unlockedFlashcardBadges: 1,
                    studyDates: 1,
                    "userDetails.username": 1,
                    "userDetails.email": 1
                }
            }
        ]);
        const userprogresses = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { userprogresses, total };
    }

    async findUserProgressById(id) {
        const cursor = await this.collection.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "gates",
                    localField: "unlockedGates",
                    foreignField: "_id",
                    as: "gateDetails"
                }
            },
            {
                $lookup: {
                    from: "journeys",
                    localField: "gateDetails.journey",
                    foreignField: "_id",
                    as: "journeyForGates"
                }
            },
            {
                $lookup: {
                    from: "stages",
                    localField: "unlockedStages",
                    foreignField: "_id",
                    as: "stageDetails"
                }
            },
            {
                $lookup: {
                    from: "gates",
                    localField: "stageDetails.gate",
                    foreignField: "_id",
                    as: "gateForStages"
                }
            },
            {
                $lookup: {
                    from: "journeys",
                    localField: "gateForStages.journey",
                    foreignField: "_id",
                    as: "journeyForStages"
                }
            },
            { $lookup: { from: "grammars", localField: "unlockedGrammars", foreignField: "_id", as: "grammarDetails" } },
            { $lookup: { from: "pronunciations", localField: "unlockedPronunciations", foreignField: "_id", as: "pronunciationDetails" } },
            { $lookup: { from: "stories", localField: "unlockedStories", foreignField: "_id", as: "storyDetails" } },
            { $lookup: { from: "grammarexercises", localField: "unlockedGrammarExercises", foreignField: "_id", as: "grammarExerciseDetails" } },
            { $lookup: { from: "pronunciationexercises", localField: "unlockedPronunciationExercises", foreignField: "_id", as: "pronunciationExerciseDetails" } },
            { $lookup: { from: "vocabularyexercises", localField: "unlockedVocabularyExercises", foreignField: "_id", as: "vocabularyExerciseDetails" } },
            { $lookup: { from: "dictationexercises", localField: "unlockedDictations", foreignField: "_id", as: "dictationExerciseDetails" } },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    "userDetails.username": 1,
                    "userDetails.email": 1,
                    dailyFlashcardGoal: 1,
                    dailyFlashcardReviews: 1,
                    experiencePoints: 1,
                    dailyExperiencePoints: 1,
                    streak: 1,
                    maxStreak: 1,
                    studyDates: 1,
                    unlockedFlashcardBadges: 1,
                    studyTimes: 1,
                    dailyStudyTimes: 1,
                    gateDetails: {
                        $map: {
                            input: "$gateDetails",
                            as: "gate",
                            in: {
                                _id: "$$gate._id",
                                name: {
                                    $concat: [
                                        "$$gate.title",
                                        " - ",
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$journeyForGates",
                                                                cond: { $eq: ["$$this._id", "$$gate.journey"] }
                                                            }
                                                        },
                                                        as: "j",
                                                        in: "$$j.title"
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    stageDetails: {
                        $map: {
                            input: "$stageDetails",
                            as: "stage",
                            in: {
                                _id: "$$stage._id",
                                name: {
                                    $let: {
                                        vars: {
                                            currentGate: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$gateForStages",
                                                            cond: { $eq: ["$$this._id", "$$stage.gate"] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            $concat: [
                                                "$$stage.title",
                                                " - ",
                                                { $ifNull: ["$$currentGate.title", "Cổng không tên"] },
                                                " - ",
                                                {
                                                    $arrayElemAt: [
                                                        {
                                                            $map: {
                                                                input: {
                                                                    $filter: {
                                                                        input: "$journeyForStages",
                                                                        cond: { $eq: ["$$this._id", "$$currentGate.journey"] }
                                                                    }
                                                                },
                                                                as: "j",
                                                                in: "$$j.title"
                                                            }
                                                        },
                                                        0
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    grammarDetails: { $map: { input: "$grammarDetails", as: "g", in: { _id: "$$g._id", title: "$$g.title" } } },
                    pronunciationDetails: { $map: { input: "$pronunciationDetails", as: "p", in: { _id: "$$p._id", title: "$$p.title" } } },
                    storyDetails: { $map: { input: "$storyDetails", as: "s", in: { _id: "$$s._id", title: "$$s.title" } } },
                    grammarExerciseDetails: { $map: { input: "$grammarExerciseDetails", as: "ge", in: { _id: "$$ge._id", title: "$$ge.title" } } },
                    pronunciationExerciseDetails: { $map: { input: "$pronunciationExerciseDetails", as: "pe", in: { _id: "$$pe._id", title: "$$pe.title" } } },
                    vocabularyExerciseDetails: { $map: { input: "$vocabularyExerciseDetails", as: "ve", in: { _id: "$$ve._id", title: "$$ve.title" } } },
                    dictationExerciseDetails: { $map: { input: "$dictationExerciseDetails", as: "de", in: { _id: "$$de._id", title: "$$de.title" } } }
                }
            }
        ]);
        return await cursor.next();
    }

    async findDetailUserProgressByUserId(userId) {
        const cursor = await this.collection.aggregate([
            { $match: { user: new ObjectId(userId) } },
            {
                $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDetails" }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $lookup: { from: "users", localField: "followers", foreignField: "_id", as: "followerDetails" } },
            { $lookup: { from: "users", localField: "following", foreignField: "_id", as: "followingDetails" } },
            {
                $lookup: { from: "gates", localField: "unlockedGates", foreignField: "_id", as: "gateDetails" }
            },
            {
                $lookup: { from: "journeys", localField: "gateDetails.journey", foreignField: "_id", as: "journeyForGates" }
            },
            {
                $lookup: { from: "stages", localField: "unlockedStages", foreignField: "_id", as: "stageDetails" }
            },
            {
                $lookup: { from: "gates", localField: "stageDetails.gate", foreignField: "_id", as: "gateForStages" }
            },
            {
                $lookup: { from: "journeys", localField: "gateForStages.journey", foreignField: "_id", as: "journeyForStages" }
            },
            { $lookup: { from: "grammars", localField: "unlockedGrammars", foreignField: "_id", as: "grammarDetails" } },
            { $lookup: { from: "pronunciations", localField: "unlockedPronunciations", foreignField: "_id", as: "pronunciationDetails" } },
            { $lookup: { from: "stories", localField: "unlockedStories", foreignField: "_id", as: "storyDetails" } },
            { $lookup: { from: "grammarexercises", localField: "unlockedGrammarExercises", foreignField: "_id", as: "grammarExerciseDetails" } },
            { $lookup: { from: "pronunciationexercises", localField: "unlockedPronunciationExercises", foreignField: "_id", as: "pronunciationExerciseDetails" } },
            { $lookup: { from: "vocabularyexercises", localField: "unlockedVocabularyExercises", foreignField: "_id", as: "vocabularyExerciseDetails" } },
            { $lookup: { from: "dictationexercises", localField: "unlockedDictations", foreignField: "_id", as: "dictationExerciseDetails" } },
            {
                $project: {
                    _id: 1,
                    user: 1,
                    "userDetails.username": 1,
                    "userDetails.email": 1,
                    followers: "$followers",
                    following: "$following",
                    followerDetails: 1,
                    followingDetails: 1,
                    dailyFlashcardGoal: 1,
                    dailyFlashcardReviews: 1,
                    experiencePoints: 1,
                    dailyExperiencePoints: 1,
                    streak: 1,
                    maxStreak: 1,
                    studyDates: 1,
                    unlockedFlashcardBadges: 1,
                    studyTimes: 1,
                    dailyStudyTimes: 1,
                    unlockedPrizes: 1,
                    diamonds: 1,
                    gateDetails: {
                        $map: {
                            input: "$gateDetails",
                            as: "gate",
                            in: {
                                _id: "$$gate._id",
                                name: {
                                    $concat: [
                                        "$$gate.title",
                                        " - ",
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$journeyForGates",
                                                                cond: { $eq: ["$$this._id", "$$gate.journey"] }
                                                            }
                                                        },
                                                        as: "j",
                                                        in: "$$j.title"
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    stageDetails: {
                        $map: {
                            input: "$stageDetails",
                            as: "stage",
                            in: {
                                _id: "$$stage._id",
                                name: {
                                    $let: {
                                        vars: {
                                            currentGate: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$gateForStages",
                                                            cond: { $eq: ["$$this._id", "$$stage.gate"] }
                                                        }
                                                    },
                                                    0
                                                ]
                                            }
                                        },
                                        in: {
                                            $concat: [
                                                "$$stage.title",
                                                " - ",
                                                { $ifNull: ["$$currentGate.title", "Cổng không tên"] },
                                                " - ",
                                                {
                                                    $arrayElemAt: [
                                                        {
                                                            $map: {
                                                                input: {
                                                                    $filter: {
                                                                        input: "$journeyForStages",
                                                                        cond: { $eq: ["$$this._id", "$$currentGate.journey"] }
                                                                    }
                                                                },
                                                                as: "j",
                                                                in: "$$j.title"
                                                            }
                                                        },
                                                        0
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    grammarDetails: { $map: { input: "$grammarDetails", as: "g", in: { _id: "$$g._id", title: "$$g.title" } } },
                    pronunciationDetails: { $map: { input: "$pronunciationDetails", as: "p", in: { _id: "$$p._id", title: "$$p.title" } } },
                    storyDetails: { $map: { input: "$storyDetails", as: "s", in: { _id: "$$s._id", title: "$$s.title" } } },
                    grammarExerciseDetails: { $map: { input: "$grammarExerciseDetails", as: "ge", in: { _id: "$$ge._id", title: "$$ge.title" } } },
                    pronunciationExerciseDetails: { $map: { input: "$pronunciationExerciseDetails", as: "pe", in: { _id: "$$pe._id", title: "$$pe.title" } } },
                    vocabularyExerciseDetails: { $map: { input: "$vocabularyExerciseDetails", as: "ve", in: { _id: "$$ve._id", title: "$$ve.title" } } },
                    dictationExerciseDetails: { $map: { input: "$dictationExerciseDetails", as: "de", in: { _id: "$$de._id", title: "$$de.title" } } }
                }
            }
        ]);
        return await cursor.next();
    }

    async findByUserId(userId) {
        return await this.collection.findOne({ user: new ObjectId(userId) });
    }

    async deleteProgress(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async insert(userProgress) {
        const now = new Date();
        userProgress.createdAt = now;
        userProgress.updatedAt = now;
        return await this.collection.insertOne(userProgress);
    }

    async update(userId, updateOperator, upsert = true) {
        if (!updateOperator.$set) updateOperator.$set = {};
        updateOperator.$set.updatedAt = new Date();
        if (updateOperator.$inc && updateOperator.$inc.experiencePoints) {
            const today = getVietnamDate();
            const xpToAdd = updateOperator.$inc.experiencePoints;
            updateOperator.$inc[`dailyExperiencePoints.${today}`] = xpToAdd;
        }
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            updateOperator,
            { upsert }
        );
    }

    async getDailyGoal(userId) {
        const doc = await this.collection.findOne({ user: new ObjectId(userId) });
        return doc?.dailyFlashcardGoal || 20;
    }

    async updateDailyGoal(userId, goal) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $set: { dailyFlashcardGoal: goal } },
            { upsert: true }
        );
    }

    async getMonthlyReviewTotal(userId, monthYear) {
        const userProgress = await this.findByUserId(userId);
        if (!userProgress?.dailyFlashcardReviews) return 0;
        return Object.entries(userProgress.dailyFlashcardReviews).filter(([dateStr]) => dateStr.startsWith(monthYear)).reduce((sum, [, count]) => sum + count, 0);
    }

    async getUnlockedBadgesForMonth(userId, monthYear) {
        const userProgress = await this.findByUserId(userId);
        return userProgress?.unlockedFlashcardBadges?.[monthYear] || [];
    }

    async unlockBadge(userId, monthYear, badgeName) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $addToSet: { [`unlockedFlashcardBadges.${monthYear}`]: badgeName } },
            { upsert: true }
        );
    }

    async unlockPrize(userId, prizeId, code, level, period = null) {
        const updateData = {
            prizeId: new ObjectId(prizeId),
            code,
            level,
            unlockedAt: new Date()
        };
        if (period) updateData.period = period;
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $addToSet: { unlockedPrizes: updateData }, $set: { updatedAt: new Date() } },
            { upsert: true }
        );
    }

    async hasUnlockedPrize(userId, code) {
        const userProgress = await this.findByUserId(userId);
        return userProgress?.unlockedPrizes?.some(p => p.code === code) || false;
    }

    async getUserPrizes(userId) {
        const userProgress = await this.findByUserId(userId);
        return userProgress?.unlockedPrizes || [];
    }

    async getFollowersCount(userId) {
        const progress = await this.findByUserId(userId);
        return progress?.followers?.length || 0;
    }

    async getFollowingCount(userId) {
        const progress = await this.findByUserId(userId);
        return progress?.following?.length || 0;
    }

    async followUser(followerUserId, targetUserId) {
        if (followerUserId === targetUserId) throw new Error("Không thể tự theo dõi");
        await this.collection.updateOne(
            { user: new ObjectId(followerUserId) },
            { $addToSet: { following: new ObjectId(targetUserId) } }
        );
        await this.collection.updateOne(
            { user: new ObjectId(targetUserId) },
            { $addToSet: { followers: new ObjectId(followerUserId) } }
        );
    }

    async unfollowUser(followerUserId, targetUserId) {
        await this.collection.updateOne(
            { user: new ObjectId(followerUserId) },
            { $pull: { following: new ObjectId(targetUserId) } }
        );
        await this.collection.updateOne(
            { user: new ObjectId(targetUserId) },
            { $pull: { followers: new ObjectId(followerUserId) } }
        );
    }

    async isFollowing(followerUserId, targetUserId) {
        const progress = await this.findByUserId(followerUserId);
        return progress?.following?.some(id => id.toString() === targetUserId) || false;
    }

    async getFollowersList(userId) {
        const progress = await this.findDetailUserProgressByUserId(userId);
        if (!progress || !progress.followers || progress.followers.length === 0) {
            return [];
        }
        const followerIds = progress.followers.map(id => new ObjectId(id));
        const users = await this.db.collection("users").find({ _id: { $in: followerIds } }).project({ username: 1, email: 1, avatar: 1 }).toArray();
        return users;
    }

    async getFollowingList(userId) {
        const progress = await this.findDetailUserProgressByUserId(userId);
        if (!progress || !progress.following || progress.following.length === 0) {
            return [];
        }
        const followingIds = progress.following.map(id => new ObjectId(id));
        const users = await this.db.collection("users").find({ _id: { $in: followingIds } }).project({ username: 1, email: 1, avatar: 1 }).toArray();
        return users;
    }

    async deleteByUser(userId) {
        const result = await this.collection.deleteOne({ user: new ObjectId(userId) });
        return result.deletedCount > 0;
    }

    async addDailyStudyTime(userId, seconds) {
        const hours = seconds / 3600;
        const today = getVietnamDate();
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            {
                $inc: {
                    studyTimes: hours,
                    [`dailyStudyTimes.${today}`]: hours
                },
                $set: { updatedAt: new Date() }
            },
            { upsert: true }
        );
    }

    async getLeaderboardByExp(period = 'all', limit = 50, periodKey = null) {
        let pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { username: "$userDetails.username", userId: "$user" }}
        ];
        let dateKeys = [];
        if (periodKey) {
            if (periodKey.includes('-W')) {
                dateKeys = this._getDateKeysForCustomWeek(periodKey);
            } else if (/^\d{4}-\d{2}$/.test(periodKey)) {
                const [y, m] = periodKey.split('-').map(Number);
                const daysInMonth = new Date(y, m, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    dateKeys.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                }
            } else if (/^\d{4}$/.test(periodKey)) {
                const y = Number(periodKey);
                const start = new Date(y, 0, 1);
                const end = new Date(y, 11, 31);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    dateKeys.push(getVietnamDate(new Date(d)));
                }
            }
        } else {
            dateKeys = this._getDateKeysForPeriod(period);
        }
        if (period === 'all') {
            pipeline.push({
                $project: { _id: "$userId", username: 1, value: { $ifNull: ["$experiencePoints", 0] }}
            });
        } else {
            pipeline.push({ $project: { username: 1, userId: 1, dailyExperiencePoints: 1 } });
            pipeline.push({
                $addFields: {
                    value: {
                        $sum: {
                            $map: {
                                input: { $objectToArray: "$dailyExperiencePoints" },
                                as: "item",
                                in: { $cond: [{ $in: ["$$item.k", dateKeys] }, "$$item.v", 0] }
                            }
                        }
                    }
                }
            });
            pipeline.push({ $project: { _id: "$userId", username: 1, value: { $round: ["$value", 0] }}});
        }
        pipeline.push(
            { $sort: { value: -1 } },
            { $limit: limit }
        );
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getLeaderboardByStudyTime(period = 'all', limit = 50, periodKey = null) {
        let pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $addFields: { username: "$userDetails.username", userId: "$user" }}
        ];
        let dateKeys = [];
        if (periodKey) {
            if (periodKey.includes('-W')) {
                dateKeys = this._getDateKeysForCustomWeek(periodKey);
            } else if (/^\d{4}-\d{2}$/.test(periodKey)) {
                const [y, m] = periodKey.split('-').map(Number);
                const daysInMonth = new Date(y, m, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    dateKeys.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                }
            } else if (/^\d{4}$/.test(periodKey)) {
                const y = Number(periodKey);
                const start = new Date(y, 0, 1);
                const end = new Date(y, 11, 31);
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    dateKeys.push(getVietnamDate(new Date(d)));
                }
            }
        } else {
            dateKeys = this._getDateKeysForPeriod(period);
        }
        if (period === 'all') {
            pipeline.push({
                $project: { _id: "$userId", username: 1,value: { $ifNull: ["$studyTimes", 0] }}
            });
        } else {
            pipeline.push({ $project: { username: 1, userId: 1, dailyStudyTimes: 1 } });
            pipeline.push({
                $addFields: {
                    value: {
                        $sum: {
                            $map: {
                                input: { $objectToArray: "$dailyStudyTimes" },
                                as: "item",
                                in: { $cond: [{ $in: ["$$item.k", dateKeys] }, "$$item.v", 0] }
                            }
                        }
                    }
                }
            });
            pipeline.push({$project: { _id: "$userId", username: 1, value: { $round: ["$value", 2] }}});
        }
        pipeline.push(
            { $sort: { value: -1 } },
            { $limit: limit }
        );
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getLeaderboardByStreak(limit = 50) {
        const pipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            { $project: { username: "$userDetails.username", streak: "$streak", maxStreak: "$maxStreak", userId: "$user" } },
            { $sort: { streak: -1, maxStreak: -1 } },
            { $limit: limit }
        ];
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getUserStatistics(userId, type = 'time', period = 'week') {
        const userProgress = await this.findByUserId(userId);
        if (!userProgress) return [];
        const now = new Date();
        let startDate;
        if (period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(now);
            startDate.setDate(diff);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        const dailyData = type === 'time' ? userProgress.dailyStudyTimes : userProgress.dailyExperiencePoints;
        const result = [];
        const current = new Date(startDate);
        while (current <= now) {
            const dateStr = getVietnamDate(current);
            const value = dailyData?.[dateStr] || 0;
            result.push({
                date: dateStr,
                value: type === 'time' ? parseFloat(value.toFixed(2)) : Math.round(value)
            });
            current.setDate(current.getDate() + 1);
        }
        return result;
    }

    _getDateKeysForPeriod(period) {
        const now = new Date();
        const keys = [];
        if (period === 'week') {
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek + 6) % 7;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - diffToMonday);
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                keys.push(getVietnamDate(d));
            }
        } else if (period === 'month') {
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                keys.push(getVietnamDate(date));
            }
        } else if (period === 'year') {
            const year = now.getFullYear();
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                keys.push(getVietnamDate(new Date(d)));
            }
        }
        return keys;
    }

    _getDateKeysForCustomWeek(weekStr) {
        const [year, week] = weekStr.split('-W').map(Number);
        const start = this._getDateOfISOWeek(week, year);
        const keys = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            keys.push(getVietnamDate(d));
        }
        return keys;
    }

    _getDateOfISOWeek(w, y) {
        const simple = new Date(y, 0, 1 + (w - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - dow + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - dow);
        }
        return ISOweekStart;
    }
}

module.exports = UserprogressRepository;