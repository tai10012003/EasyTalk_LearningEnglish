const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('../config/setting');

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
                                    $concat: [
                                        "$$stage.title",
                                        " - ",
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$gateForStages",
                                                                cond: { $eq: ["$$this._id", "$$stage.gate"] }
                                                            }
                                                        },
                                                        as: "g",
                                                        in: "$$g.title"
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        " - ",
                                        {
                                            $arrayElemAt: [
                                                {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$journeyForStages",
                                                                cond: { $eq: ["$$this._id", { $arrayElemAt: ["$gateForStages.journey", 0] }] }
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
            const today = new Date().toISOString().split('T')[0];
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
        if (!userProgress?.unlockedFlashcardBadges) return [];
        return userProgress.unlockedFlashcardBadges[monthYear] || [];
    }

    async unlockBadge(userId, monthYear, badgeName) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            {
                $addToSet: { [`unlockedFlashcardBadges.${monthYear}`]: badgeName }
            },
            { upsert: true }
        );
    }

    async deleteByUser(userId) {
        const result = await this.collection.deleteOne({ user: new ObjectId(userId) });
        return result.deletedCount > 0;
    }

    async addDailyStudyTime(userId, seconds) {
        const hours = seconds / 3600;
        const today = new Date().toISOString().split('T')[0];
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

    async getLeaderboardByExp(period = 'all', limit = 50) {
        let pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }
        ];
        if (period == 'all') {
            pipeline.push({
                $project: {
                    username: "$userDetails.username",
                    value: { $ifNull: ["$experiencePoints", 0] }
                }
            });
        } else {
            const dateKeys = this._getDateKeysForPeriod(period);
            pipeline.push({
                $project: {
                    username: "$userDetails.username",
                    dailyExperiencePoints: 1
                }
            });
            pipeline.push({
                $addFields: {
                    value: {
                        $sum: {
                            $map: {
                                input: { $objectToArray: "$dailyExperiencePoints" },
                                as: "item",
                                in: {
                                    $cond: [
                                        { $in: ["$$item.k", dateKeys] },
                                        "$$item.v",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            });
        }
        pipeline.push(
            { $sort: { value: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    value: { $round: ["$value", 0] }
                }
            }
        );
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }

    async getLeaderboardByStudyTime(period = 'all', limit = 50) {
        let pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }
        ];
        if (period == 'all') {
            pipeline.push({
                $project: {
                    username: "$userDetails.username",
                    value: { $ifNull: ["$studyTimes", 0] }
                }
            });
        } else {
            const dateKeys = this._getDateKeysForPeriod(period);
            pipeline.push({
                $project: {
                    username: "$userDetails.username",
                    dailyStudyTimes: 1
                }
            });
            pipeline.push({
                $addFields: {
                    value: {
                        $sum: {
                            $map: {
                                input: { $objectToArray: "$dailyStudyTimes" },
                                as: "item",
                                in: {
                                    $cond: [
                                        { $in: ["$$item.k", dateKeys] },
                                        "$$item.v",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            });
        }
        pipeline.push(
            { $sort: { value: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    value: { $round: ["$value", 2] }
                }
            }
        );
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }

    async getLeaderboardByStreak(limit = 50) {
        const pipeline = [
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
                    username: "$userDetails.username",
                    streak: "$streak",
                    maxStreak: "$maxStreak"
                }
            },
            { $sort: { streak: -1, maxStreak: -1 } },
            { $limit: limit }
        ];
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    }

    _getDateKeysForPeriod(period) {
        const now = new Date();
        const keys = [];
        if (period == 'week') {
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek + 6) % 7;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - diffToMonday);
            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                keys.push(this._formatDate(d));
            }
        } else if (period == 'month') {
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                keys.push(this._formatDate(date));
            }
        } else if (period == 'year') {
            const year = now.getFullYear();
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                keys.push(this._formatDate(new Date(d)));
            }
        }
        return keys;
    }

    _formatDate(date) {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}

module.exports = UserprogressRepository;