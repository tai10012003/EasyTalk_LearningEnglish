const { getVietnamDate } = require('../../../shared/utils/dateFormat');
const { buildUserActivityQuery, buildNewUsersQuery, buildActiveUsersQuery,getStartOfWeek,getStartOfMonth,getStartOfDay } = require('../repositories/queries/activityQueries');
const { formatTimeAgo } = require('../utils/formatHelpers');

class ActivityAnalyticsService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.db = userRepository.db;
    }

    async getUserActivityLast7Days() {
        try {
            const labels = [];
            const data = [];
            const today = new Date();
            for(let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const vnDate = getVietnamDate(date);
                const [year, month, day] = vnDate.split('-');
                labels.push(`${day}/${month}/${year}`);
                const startOfDay = new Date(`${vnDate}T00:00:00.000+07:00`);
                const endOfDay = new Date(`${vnDate}T23:59:59.999+07:00`);
                const query = buildUserActivityQuery(startOfDay, endOfDay);
                const count = await this.userRepository.collection.countDocuments(query);
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
            const totalJourneys = await this.db.collection('journeys').countDocuments();
            const totalGrammars = await this.db.collection('grammars').countDocuments();
            const totalPronunciations = await this.db.collection('pronunciations').countDocuments();
            const totalStories = await this.db.collection('stories').countDocuments();
            const totalLessons = totalGrammars + totalPronunciations + totalStories;
            const totalGrammarExercises = await this.db.collection('grammarexercises').countDocuments();
            const totalPronunciationExercises = await this.db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyExercises = await this.db.collection('vocabularyexercises').countDocuments();
            const totalDictationExercises = await this.db.collection('dictationexercises').countDocuments();
            const totalExercises = totalGrammarExercises + totalPronunciationExercises + totalVocabularyExercises + totalDictationExercises;
            const totalUsers = await this.userRepository.collection.countDocuments();
            const now = new Date();
            const startOfMonth = getStartOfMonth(now);
            const newUsersQuery = buildNewUsersQuery(startOfMonth);
            const newUsersThisMonth = await this.userRepository.collection.countDocuments(newUsersQuery);
            const startOfWeek = getStartOfWeek(now);
            const activeUsersWeekQuery = buildActiveUsersQuery(startOfWeek);
            const activeUsersThisWeek = await this.userRepository.collection.countDocuments(activeUsersWeekQuery);
            const startOfToday = getStartOfDay(now);
            const activeUsersTodayQuery = buildActiveUsersQuery(startOfToday);
            const activeUsersToday = await this.userRepository.collection.countDocuments(activeUsersTodayQuery);
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

    async getRecentActivities(limit = 10) {
        try {
            const recentUsers = await this.userRepository.collection.find().sort({ createdAt: -1 }).limit(limit).toArray();
            const activities = [];
            for(const user of recentUsers) {
                const timeDiff = Date.now() - new Date(user.createdAt).getTime();
                const timeAgo = formatTimeAgo(timeDiff);
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
}

module.exports = ActivityAnalyticsService;