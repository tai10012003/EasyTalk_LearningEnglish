const UserProgressRepository = require('../repositories/userprogressRepository');

class LeaderboardService {
    constructor() {
        this.userProgressRepository = new UserProgressRepository();
    }

    async getLeaderboard(type = 'exp', period = 'all', limit = 50) {
        if(type === 'exp') return await this.userProgressRepository.getLeaderboardByExp(period, limit);
        if(type === 'time') return await this.userProgressRepository.getLeaderboardByStudyTime(period, limit);
        if(type === 'streak') return await this.userProgressRepository.getLeaderboardByStreak(limit);
    }

    async getUserStatistics(userId, type = 'time', period = 'week') {
        return await this.userProgressRepository.getUserStatistics(userId, type, period);
    }
}

module.exports = LeaderboardService;