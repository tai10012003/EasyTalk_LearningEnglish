const { ObjectId } = require('mongodb');
const DatabaseConnection = require('../../../shared/database/database');
const config = require('../../../shared/config/setting');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');
const { buildFindAllPipeline, buildFindByIdPipeline, buildDetailByUserIdPipeline } = require('./queries/detailQueries');
const { buildLeaderboardExpPipeline, buildLeaderboardTimePipeline, buildLeaderboardStreakPipeline } = require('./queries/leaderboardQueries');
const { resolveDateKeys } = require('../utils/dateHelper');

class UserProgressRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("userprogresses");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const pipeline = buildFindAllPipeline(filter, skip, limit);
        const userprogresses = await this.collection.aggregate(pipeline).toArray();
        const total = await this.collection.countDocuments(filter);
        return { userprogresses, total };
    }

    async findUserProgressById(id) {
        const pipeline = buildFindByIdPipeline(id);
        return await this.collection.aggregate(pipeline).next();
    }

    async findDetailUserProgressByUserId(userId) {
        const pipeline = buildDetailByUserIdPipeline(userId);
        return await this.collection.aggregate(pipeline).next();
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
        if(!updateOperator.$set) updateOperator.$set = {};
        updateOperator.$set.updatedAt = new Date();
        if(updateOperator.$inc && updateOperator.$inc.experiencePoints) {
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
        if(period) updateData.period = period;
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
        if(followerUserId === targetUserId) throw new Error("Không thể tự theo dõi");
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
        if(!progress || !progress.followers || progress.followers.length === 0) {
            return [];
        }
        const followerIds = progress.followers.map(id => new ObjectId(id));
        return await this.db.collection("users").find({ _id: { $in: followerIds } }).project({ username: 1, email: 1, avatar: 1 }).toArray();
    }

    async getFollowingList(userId) {
        const progress = await this.findDetailUserProgressByUserId(userId);
        if(!progress || !progress.following || progress.following.length === 0) {
            return [];
        }
        const followingIds = progress.following.map(id => new ObjectId(id));
        return await this.db.collection("users").find({ _id: { $in: followingIds } }).project({ username: 1, email: 1, avatar: 1 }).toArray();
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
        const dateKeys = period === 'all' ? [] : resolveDateKeys(period, periodKey);
        const pipeline = buildLeaderboardExpPipeline(period, limit, dateKeys);
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getLeaderboardByStudyTime(period = 'all', limit = 50, periodKey = null) {
        const dateKeys = period === 'all' ? [] : resolveDateKeys(period, periodKey);
        const pipeline = buildLeaderboardTimePipeline(period, limit, dateKeys);
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getLeaderboardByStreak(limit = 50) {
        const pipeline = buildLeaderboardStreakPipeline(limit);
        const result = await this.collection.aggregate(pipeline).toArray();
        return result.map((item, index) => ({ ...item, rank: index + 1 }));
    }

    async getUserStatistics(userId, type = 'time', period = 'week') {
        const userProgress = await this.findByUserId(userId);
        if(!userProgress) return [];
        const now = new Date();
        let startDate;
        if(period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(now);
            startDate.setDate(diff);
        } else if(period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if(period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        const dailyData = type === 'time' ? userProgress.dailyStudyTimes : userProgress.dailyExperiencePoints;
        const result = [];
        const current = new Date(startDate);
        while(current <= now) {
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
}

module.exports = UserProgressRepository;