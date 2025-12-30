const { UserRepository, UserprogressRepository } = require('./../repositories');
const { getVietnamDate } = require('../util/dateFormat');

class DashboardService {
    constructor() {
        this.userRepository = new UserRepository();
        this.userprogressRepository = new UserprogressRepository();
    }

    async getUserActivityLast7Days() {
        try {
            const labels = [];
            const data = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const vnDate = getVietnamDate(date);
                const [year, month, day] = vnDate.split('-');
                labels.push(`${day}/${month}/${year}`);
                const startOfDay = new Date(`${vnDate}T00:00:00.000+07:00`);
                const endOfDay = new Date(`${vnDate}T23:59:59.999+07:00`);
                const count = await this.userRepository.collection.countDocuments({
                    lastActive: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                });
                data.push(count);
            }
            return { labels, data };
        } catch (error) {
            console.error('Error getting user activity:', error);
            throw new Error('Không thể lấy dữ liệu hoạt động người dùng');
        }
    }

    async getDashboardOverview() {
        try {
            const db = this.userRepository.db;
            const totalJourneys = await db.collection('journeys').countDocuments();
            const totalGrammars = await db.collection('grammars').countDocuments();
            const totalPronunciations = await db.collection('pronunciations').countDocuments();
            const totalStories = await db.collection('stories').countDocuments();
            const totalLessons = totalGrammars + totalPronunciations + totalStories;
            const totalGrammarExercises = await db.collection('grammarexercises').countDocuments();
            const totalPronunciationExercises = await db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyExercises = await db.collection('vocabularyexercises').countDocuments();
            const totalDictationExercises = await db.collection('dictationexercises').countDocuments();
            const totalExercises = totalGrammarExercises + totalPronunciationExercises + totalVocabularyExercises + totalDictationExercises;
            const totalUsers = await this.userRepository.collection.countDocuments();
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const newUsersThisMonth = await this.userRepository.collection.countDocuments({
                createdAt: { $gte: startOfMonth }
            });
            const startOfWeek = new Date(now);
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek + 6) % 7;
            startOfWeek.setDate(now.getDate() - diffToMonday);
            startOfWeek.setHours(0, 0, 0, 0);
            const activeUsersThisWeek = await this.userRepository.collection.countDocuments({
                lastActive: { $gte: startOfWeek }
            });
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const activeUsersToday = await this.userRepository.collection.countDocuments({
                lastActive: { $gte: startOfToday }
            });
            return {
                totalJourneys,
                totalLessons,
                totalExercises,
                totalUsers,
                newUsersThisMonth,
                activeUsersThisWeek,
                activeUsersToday
            };
        } catch (error) {
            console.error('Error getting dashboard overview:', error);
            throw new Error('Không thể lấy tổng quan dashboard');
        }
    }

    async getLessonBreakdown() {
        try {
            const db = this.userRepository.db;
            const totalGrammars = await db.collection('grammars').countDocuments();
            const totalPronunciations = await db.collection('pronunciations').countDocuments();
            const totalStories = await db.collection('stories').countDocuments();
            return [
                { name: "Ngữ Pháp", y: totalGrammars },
                { name: "Phát Âm", y: totalPronunciations },
                { name: "Câu Chuyện", y: totalStories }
            ];
        } catch (error) {
            console.error('Error getting lesson breakdown:', error);
            throw new Error('Không thể lấy tỷ lệ bài học');
        }
    }

    async getExerciseBreakdown() {
        try {
            const db = this.userRepository.db;
            const totalGrammarExercises = await db.collection('grammarexercises').countDocuments();
            const totalPronunciationExercises = await db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyExercises = await db.collection('vocabularyexercises').countDocuments();
            const totalDictationExercises = await db.collection('dictationexercises').countDocuments();
            return [
                { name: "Ngữ Pháp", y: totalGrammarExercises },
                { name: "Phát Âm", y: totalPronunciationExercises },
                { name: "Từ Vựng", y: totalVocabularyExercises },
                { name: "Nghe Chép Chính Tả", y: totalDictationExercises }
            ];
        } catch (error) {
            console.error('Error getting exercise breakdown:', error);
            throw new Error('Không thể lấy tỷ lệ bài luyện tập');
        }
    }

    async getRecentActivities(limit = 10) {
        try {
            const db = this.userRepository.db;
            const recentUsers = await this.userRepository.collection.find().sort({ createdAt: -1 }).limit(limit).toArray();
            const activities = [];
            for (const user of recentUsers) {
                const timeDiff = Date.now() - new Date(user.createdAt).getTime();
                const timeAgo = this.formatTimeAgo(timeDiff);
                activities.push({
                    id: user._id.toString(),
                    user: user.username,
                    action: "Đăng ký tài khoản mới",
                    time: timeAgo,
                    icon: "fas fa-user-plus",
                    color: "text-info"
                });
            }
            return activities;
        } catch (error) {
            console.error('Error getting recent activities:', error);
            throw new Error('Không thể lấy hoạt động gần đây');
        }
    }

    async getTopUsersByExp(limit = 10) {
        try {
            const leaderboard = await this.userprogressRepository.getLeaderboardByExp('all', limit);
            return leaderboard.map(item => ({
                rank: item.rank,
                username: item.username,
                value: Math.round(item.value),
                userId: item._id.toString()
            }));
        } catch (error) {
            console.error('Error getting top users by exp:', error);
            throw new Error('Không thể lấy bảng xếp hạng theo điểm kinh nghiệm');
        }
    }

    async getTopUsersByStudyTime(limit = 10) {
        try {
            const leaderboard = await this.userprogressRepository.getLeaderboardByStudyTime('all', limit);
            return leaderboard.map(item => ({
                rank: item.rank,
                username: item.username,
                value: item.value,
                formattedValue: this.formatStudyTime(item.value),
                userId: item._id.toString()
            }));
        } catch (error) {
            console.error('Error getting top users by study time:', error);
            throw new Error('Không thể lấy bảng xếp hạng theo thời gian học');
        }
    }

    async getTopUsersByStreak(limit = 10) {
        try {
            const leaderboard = await this.userprogressRepository.getLeaderboardByStreak(limit);
            return leaderboard.map(item => ({
                rank: item.rank,
                username: item.username,
                value: item.streak,
                maxStreak: item.maxStreak,
                userId: item.userId.toString()
            }));
        } catch (error) {
            console.error('Error getting top users by streak:', error);
            throw new Error('Không thể lấy bảng xếp hạng theo streak');
        }
    }

    formatStudyTime(hours) {
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes} phút`;
        }
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        if (minutes === 0) {
            return `${wholeHours} giờ`;
        }
        return `${wholeHours} giờ ${minutes} phút`;
    }

    formatTimeAgo(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days} ngày trước`;
        if (hours > 0) return `${hours} giờ trước`;
        if (minutes > 0) return `${minutes} phút trước`;
        return `${seconds} giây trước`;
    }

    async getLessonCompletionStats() {
        try {
            const db = this.userRepository.db;
            const totalGrammars = await db.collection('grammars').countDocuments();
            const totalPronunciations = await db.collection('pronunciations').countDocuments();
            const totalStories = await db.collection('stories').countDocuments();
            const totalUserProgresses = await db.collection('userprogresses').countDocuments();
            if (totalUserProgresses === 0) {
                return {
                    grammars: { total: totalGrammars, avgUnlocked: 0, percentage: 0 },
                    pronunciations: { total: totalPronunciations, avgUnlocked: 0, percentage: 0 },
                    stories: { total: totalStories, avgUnlocked: 0, percentage: 0 }
                };
            }
            const grammarStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedGrammars", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const pronunciationStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedPronunciations", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const storyStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedStories", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const avgGrammars = grammarStats.length > 0 ? grammarStats[0].total / totalUserProgresses : 0;
            const avgPronunciations = pronunciationStats.length > 0 ? pronunciationStats[0].total / totalUserProgresses : 0;
            const avgStories = storyStats.length > 0 ? storyStats[0].total / totalUserProgresses : 0;
            return {
                grammars: {
                    total: totalGrammars,
                    avgUnlocked: Math.round(avgGrammars * 10) / 10,
                    percentage: totalGrammars > 0 ? Math.round((avgGrammars / totalGrammars) * 100) : 0
                },
                pronunciations: {
                    total: totalPronunciations,
                    avgUnlocked: Math.round(avgPronunciations * 10) / 10,
                    percentage: totalPronunciations > 0 ? Math.round((avgPronunciations / totalPronunciations) * 100) : 0
                },
                stories: {
                    total: totalStories,
                    avgUnlocked: Math.round(avgStories * 10) / 10,
                    percentage: totalStories > 0 ? Math.round((avgStories / totalStories) * 100) : 0
                }
            };
        } catch (error) {
            console.error('Error getting lesson completion stats:', error);
            throw new Error('Không thể lấy thống kê hoàn thành bài học');
        }
    }

    async getExerciseCompletionStats() {
        try {
            const db = this.userRepository.db;
            const totalGrammarEx = await db.collection('grammarexercises').countDocuments();
            const totalPronunciationEx = await db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyEx = await db.collection('vocabularyexercises').countDocuments();
            const totalDictationEx = await db.collection('dictationexercises').countDocuments();
            const totalUserProgresses = await db.collection('userprogresses').countDocuments();
            if (totalUserProgresses === 0) {
                return {
                    grammarExercises: { total: totalGrammarEx, avgUnlocked: 0, percentage: 0 },
                    pronunciationExercises: { total: totalPronunciationEx, avgUnlocked: 0, percentage: 0 },
                    vocabularyExercises: { total: totalVocabularyEx, avgUnlocked: 0, percentage: 0 },
                    dictationExercises: { total: totalDictationEx, avgUnlocked: 0, percentage: 0 }
                };
            }
            const grammarExStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedGrammarExercises", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const pronunciationExStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedPronunciationExercises", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const vocabularyExStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedVocabularyExercises", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const dictationExStats = await db.collection('userprogresses').aggregate([
                { $project: { count: { $size: { $ifNull: ["$unlockedDictations", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ]).toArray();
            const avgGrammarEx = grammarExStats.length > 0 ? grammarExStats[0].total / totalUserProgresses : 0;
            const avgPronunciationEx = pronunciationExStats.length > 0 ? pronunciationExStats[0].total / totalUserProgresses : 0;
            const avgVocabularyEx = vocabularyExStats.length > 0 ? vocabularyExStats[0].total / totalUserProgresses : 0;
            const avgDictationEx = dictationExStats.length > 0 ? dictationExStats[0].total / totalUserProgresses : 0;
            return {
                grammarExercises: {
                    total: totalGrammarEx,
                    avgUnlocked: Math.round(avgGrammarEx * 10) / 10,
                    percentage: totalGrammarEx > 0 ? Math.round((avgGrammarEx / totalGrammarEx) * 100) : 0
                },
                pronunciationExercises: {
                    total: totalPronunciationEx,
                    avgUnlocked: Math.round(avgPronunciationEx * 10) / 10,
                    percentage: totalPronunciationEx > 0 ? Math.round((avgPronunciationEx / totalPronunciationEx) * 100) : 0
                },
                vocabularyExercises: {
                    total: totalVocabularyEx,
                    avgUnlocked: Math.round(avgVocabularyEx * 10) / 10,
                    percentage: totalVocabularyEx > 0 ? Math.round((avgVocabularyEx / totalVocabularyEx) * 100) : 0
                },
                dictationExercises: {
                    total: totalDictationEx,
                    avgUnlocked: Math.round(avgDictationEx * 10) / 10,
                    percentage: totalDictationEx > 0 ? Math.round((avgDictationEx / totalDictationEx) * 100) : 0
                }
            };
        } catch (error) {
            console.error('Error getting exercise completion stats:', error);
            throw new Error('Không thể lấy thống kê hoàn thành bài tập');
        }
    }

    async getMostPopularLessons() {
        try {
            const db = this.userRepository.db;
            const popularGrammar = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedGrammars" },
                { $group: { _id: "$unlockedGrammars", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'grammars',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Ngữ Pháp" }
                    }
                }
            ]).toArray();
            const popularPronunciation = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedPronunciations" },
                { $group: { _id: "$unlockedPronunciations", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'pronunciations',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Phát Âm" }
                    }
                }
            ]).toArray();
            const popularStory = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedStories" },
                { $group: { _id: "$unlockedStories", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'stories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Câu Chuyện" }
                    }
                }
            ]).toArray();
            return {
                grammar: popularGrammar.length > 0 ? popularGrammar[0] : null,
                pronunciation: popularPronunciation.length > 0 ? popularPronunciation[0] : null,
                story: popularStory.length > 0 ? popularStory[0] : null
            };
        } catch (error) {
            console.error('Error getting most popular lessons:', error);
            throw new Error('Không thể lấy bài học phổ biến nhất');
        }
    }

    async getMostPopularExercises() {
        try {
            const db = this.userRepository.db;
            const collections = [
                { field: 'unlockedGrammarExercises', collection: 'grammarexercises', type: 'Ngữ Pháp' },
                { field: 'unlockedPronunciationExercises', collection: 'pronunciationexercises', type: 'Phát Âm' },
                { field: 'unlockedVocabularyExercises', collection: 'vocabularyexercises', type: 'Từ Vựng' },
                { field: 'unlockedDictations', collection: 'dictationexercises', type: 'Nghe Chép Chính Tả' }
            ];
            const results = {};
            for (const { field, collection, type } of collections) {
                const popular = await db.collection('userprogresses').aggregate([
                    { $unwind: `$${field}` },
                    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: collection,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'details'
                        }
                    },
                    { $unwind: "$details" },
                    {
                        $project: {
                            _id: 1,
                            title: "$details.title",
                            count: 1,
                            type: { $literal: type }
                        }
                    }
                ]).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = popular.length > 0 ? popular[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting most popular exercises:', error);
            throw new Error('Không thể lấy bài tập phổ biến nhất');
        }
    }

    async getLeastPopularLessons() {
        try {
            const db = this.userRepository.db;
            const hardestGrammar = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedGrammars" },
                { $group: { _id: "$unlockedGrammars", count: { $sum: 1 } } },
                { $sort: { count: 1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'grammars',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Ngữ Pháp" }
                    }
                }
            ]).toArray();
            const hardestPronunciation = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedPronunciations" },
                { $group: { _id: "$unlockedPronunciations", count: { $sum: 1 } } },
                { $sort: { count: 1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'pronunciations',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Phát Âm" }
                    }
                }
            ]).toArray();
            const hardestStory = await db.collection('userprogresses').aggregate([
                { $unwind: "$unlockedStories" },
                { $group: { _id: "$unlockedStories", count: { $sum: 1 } } },
                { $sort: { count: 1 } },
                { $limit: 1 },
                {
                    $lookup: {
                        from: 'stories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'details'
                    }
                },
                { $unwind: "$details" },
                {
                    $project: {
                        _id: 1,
                        title: "$details.title",
                        count: 1,
                        type: { $literal: "Câu Chuyện" }
                    }
                }
            ]).toArray();
            return {
                grammar: hardestGrammar.length > 0 ? hardestGrammar[0] : null,
                pronunciation: hardestPronunciation.length > 0 ? hardestPronunciation[0] : null,
                story: hardestStory.length > 0 ? hardestStory[0] : null
            };
        } catch (error) {
            console.error('Error getting least popular lessons:', error);
            throw new Error('Không thể lấy bài học khó nhất');
        }
    }

    async getLeastPopularExercises() {
        try {
            const db = this.userRepository.db;
            const collections = [
                { field: 'unlockedGrammarExercises', collection: 'grammarexercises', type: 'Ngữ Pháp' },
                { field: 'unlockedPronunciationExercises', collection: 'pronunciationexercises', type: 'Phát Âm' },
                { field: 'unlockedVocabularyExercises', collection: 'vocabularyexercises', type: 'Từ Vựng' },
                { field: 'unlockedDictations', collection: 'dictationexercises', type: 'Nghe Chép Chính Tả' }
            ];
            const results = {};
            for (const { field, collection, type } of collections) {
                const hardest = await db.collection('userprogresses').aggregate([
                    { $unwind: `$${field}` },
                    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
                    { $sort: { count: 1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: collection,
                            localField: '_id',
                            foreignField: '_id',
                            as: 'details'
                        }
                    },
                    { $unwind: "$details" },
                    {
                        $project: {
                            _id: 1,
                            title: "$details.title",
                            count: 1,
                            type: { $literal: type }
                        }
                    }
                ]).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = hardest.length > 0 ? hardest[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting least popular exercises:', error);
            throw new Error('Không thể lấy bài tập khó nhất');
        }
    }
}

module.exports = DashboardService;