const { transformLeaderboardData } = require('../repositories/queries/leaderboardQueries');
const { formatStudyTime } = require('../utils/formatHelpers');

class LeaderboardAnalyticsService {
    constructor(userProgressRepository) {
        this.userProgressRepository = userProgressRepository;
    }

    async getTopUsersByExp(limit = 10) {
        try {
            const leaderboard = await this.userProgressRepository.getLeaderboardByExp('all', limit);
            return transformLeaderboardData(leaderboard);
        } catch (error) {
            console.error('Error getting top users by exp:', error);
            throw new Error('Không thể lấy bảng xếp hạng theo điểm kinh nghiệm');
        }
    }

    async getTopUsersByStudyTime(limit = 10) {
        try {
            const leaderboard = await this.userProgressRepository.getLeaderboardByStudyTime('all', limit);
            return transformLeaderboardData(leaderboard, formatStudyTime);
        } catch (error) {
            console.error('Error getting top users by study time:', error);
            throw new Error('Không thể lấy bảng xếp hạng theo thời gian học');
        }
    }

    async getTopUsersByStreak(limit = 10) {
        try {
            const leaderboard = await this.userProgressRepository.getLeaderboardByStreak(limit);
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
}

module.exports = LeaderboardAnalyticsService;