const { createUserProgressController } = require('./controllers/userprogressController');
const UserProgressService = require('./services/userprogressService');
const StreakService = require('./services/streakService');
const LeaderboardService = require('./services/leaderboardService');
const BadgeService = require('./services/badgeService');
const UserPrizeService = require('./services/userprizeService');
const FollowService = require('./services/followService');
const UserProgressRepository = require('./repositories/userprogressRepository');

module.exports = {
    createUserProgressController,
    UserProgressService,
    StreakService,
    LeaderboardService,
    BadgeService,
    UserPrizeService,
    FollowService,
    UserProgressRepository
};
