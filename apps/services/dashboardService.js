const { UserRepository } = require('./../repositories');
const { getVietnamDate } = require('../util/dateFormat');

class DashboardService {
    constructor() {
        this.userRepository = new UserRepository();
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
                { name: "Nghe Chép", y: totalDictationExercises }
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
}

module.exports = DashboardService;