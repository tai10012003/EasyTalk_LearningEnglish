const { getStartOfDay } = require('../repositories/queries/activityQueries');

class SecurityDashboardService {
    constructor(db) {
        this.db = db;
        this.userSessionsCollection = db.collection("usersessions");
        this.securityLogsCollection = db.collection("securitylogs");
    }

    async getSecurityOverview() {
        try {
            const startOfToday = getStartOfDay(new Date());
            const [
                activeSessions,
                revokedSessionsToday,
                rotatedSessionsToday,
                failedLoginsToday,
                suspiciousRefreshReuse,
                recentSecurityLogs,
                recentActiveSessions
            ] = await Promise.all([
                this.userSessionsCollection.countDocuments({
                    revokedAt: null,
                    expiresAt: { $gt: new Date() }
                }),
                this.userSessionsCollection.countDocuments({
                    revokedAt: { $gte: startOfToday }
                }),
                this.userSessionsCollection.countDocuments({
                    revokeReason: "rotated",
                    revokedAt: { $gte: startOfToday }
                }),
                this.securityLogsCollection.countDocuments({
                    event: "login_failed",
                    createdAt: { $gte: startOfToday }
                }),
                this.securityLogsCollection.countDocuments({
                    event: "refresh_token_reuse_detected",
                    createdAt: { $gte: startOfToday }
                }),
                this.getRecentSecurityLogs(10),
                this.getRecentActiveSessions(10)
            ]);

            return {
                activeSessions,
                revokedSessionsToday,
                rotatedSessionsToday,
                failedLoginsToday,
                suspiciousRefreshReuse,
                recentSecurityLogs,
                recentActiveSessions
            };
        } catch (error) {
            console.error('Error getting security overview:', error);
            throw new Error('Không thể lấy dữ liệu bảo mật dashboard');
        }
    }

    async getRecentSecurityLogs(limit = 10) {
        return await this.securityLogsCollection
            .find({})
            .project({
                event: 1,
                status: 1,
                userId: 1,
                actorId: 1,
                email: 1,
                reason: 1,
                ipAddress: 1,
                createdAt: 1
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    }

    async getRecentActiveSessions(limit = 10) {
        return await this.userSessionsCollection
            .find({
                revokedAt: null,
                expiresAt: { $gt: new Date() }
            })
            .project({
                sessionId: 1,
                userId: 1,
                userAgent: 1,
                ipAddress: 1,
                createdAt: 1,
                updatedAt: 1,
                lastUsedAt: 1,
                expiresAt: 1
            })
            .sort({ lastUsedAt: -1, createdAt: -1 })
            .limit(limit)
            .toArray();
    }
}

module.exports = SecurityDashboardService;