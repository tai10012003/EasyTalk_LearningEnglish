const ActivityAnalyticsService = require('./activityAnalyticsService');
const ContentAnalyticsService = require('./contentAnalyticsService');
const LeaderboardAnalyticsService = require('./leaderboardAnalyticsService');

class DashboardService {
    constructor(userRepository, userProgressRepository, deps = {}) {
        this.activityService = deps.activityService || new ActivityAnalyticsService(userRepository);
        this.contentService = deps.contentService || new ContentAnalyticsService(userRepository.db);
        this.leaderboardService = deps.leaderboardService || new LeaderboardAnalyticsService(userProgressRepository);
    }

    async getUserActivityLast7Days() {
        return await this.activityService.getUserActivityLast7Days();
    }

    async getDashboardOverview() {
        return await this.activityService.getDashboardOverview();
    }

    async getRecentActivities(limit = 10) {
        return await this.activityService.getRecentActivities(limit);
    }

    async getLessonBreakdown() {
        return await this.contentService.getLessonBreakdown();
    }

    async getExerciseBreakdown() {
        return await this.contentService.getExerciseBreakdown();
    }

    async getLessonCompletionStats() {
        return await this.contentService.getLessonCompletionStats();
    }

    async getExerciseCompletionStats() {
        return await this.contentService.getExerciseCompletionStats();
    }

    async getMostPopularLessons() {
        return await this.contentService.getMostPopularLessons();
    }

    async getMostPopularExercises() {
        return await this.contentService.getMostPopularExercises();
    }

    async getLeastPopularLessons() {
        return await this.contentService.getLeastPopularLessons();
    }

    async getLeastPopularExercises() {
        return await this.contentService.getLeastPopularExercises();
    }

    async getTopUsersByExp(limit = 10) {
        return await this.leaderboardService.getTopUsersByExp(limit);
    }

    async getTopUsersByStudyTime(limit = 10) {
        return await this.leaderboardService.getTopUsersByStudyTime(limit);
    }

    async getTopUsersByStreak(limit = 10) {
        return await this.leaderboardService.getTopUsersByStreak(limit);
    }
}

module.exports = DashboardService;