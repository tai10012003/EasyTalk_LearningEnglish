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

    async findByUserId(userId) {
        return await this.collection.findOne({ user: new ObjectId(userId) });
    }

    async insert(userProgress) {
        return await this.collection.insertOne(userProgress);
    }

    async update(userId, updateOperator, upsert = true) {
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

    async delete(userId) {
        const result = await this.collection.deleteOne({ user: new ObjectId(userId) });
        return result.deletedCount > 0;
    }

    async getLeaderboard(limit = 10) {
        return await this.collection.aggregate([
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
}

module.exports = UserprogressRepository;