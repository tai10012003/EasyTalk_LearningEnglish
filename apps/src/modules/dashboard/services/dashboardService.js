class DashboardService {
    constructor(userRepository, userProgressRepository, deps = {}) {
        if (!deps.activityService) {
            throw new Error("DashboardService requires activityService");
        }
        if (!deps.contentService) {
            throw new Error("DashboardService requires contentService");
        }
        if (!deps.leaderboardService) {
            throw new Error("DashboardService requires leaderboardService");
        }
        if (!deps.securityService) {
            throw new Error("DashboardService requires securityService");
        }
        if (!deps.agentDebugService) {
            throw new Error("DashboardService requires agentDebugService");
        }
        this.activityService = deps.activityService;
        this.contentService = deps.contentService;
        this.leaderboardService = deps.leaderboardService;
        this.securityService = deps.securityService;
        this.agentDebugService = deps.agentDebugService;
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

    async getSecurityOverview() {
        return await this.securityService.getSecurityOverview();
    }

    async getAgentDebugOverview() {
        return await this.agentDebugService.getAgentDebugOverview();
    }
}

module.exports = DashboardService;
