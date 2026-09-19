const { createDashboardController } = require('./controllers/dashboardController');
const DashboardService = require('./services/dashboardService');
const ActivityAnalyticsService = require('./services/activityAnalyticsService');
const ContentAnalyticsService = require('./services/contentAnalyticsService');
const LeaderboardAnalyticsService = require('./services/leaderboardAnalyticsService');
const SecurityDashboardService = require('./services/securityDashboardService');
const AgentDebugDashboardService = require('./services/agentDebugDashboardService');

module.exports = {
    createDashboardController,
    DashboardService,
    ActivityAnalyticsService,
    ContentAnalyticsService,
    LeaderboardAnalyticsService,
    SecurityDashboardService,
    AgentDebugDashboardService
};
