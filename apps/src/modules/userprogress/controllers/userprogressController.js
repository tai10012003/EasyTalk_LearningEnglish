const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { getVietnamDate } = require('../../../shared/utils/dateFormat');
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const UserProgressService = require('../services/userprogressService');
const BadgeService = require('../services/badgeService');
const StreakService = require('../services/streakService');
const UserPrizeService = require('../services/userprizeService');
const LeaderboardService = require('../services/leaderboardService');
const FollowService = require('../services/followService');

let userProgressService = new UserProgressService();
let badgeService = new BadgeService();
let streakService = new StreakService();
let userPrizeService = new UserPrizeService();
let leaderboardService = new LeaderboardService();
let followService = new FollowService();

userProgressService.setBadgeService(badgeService);
userProgressService.setStreakService(streakService);
userProgressService.setUserPrizeService(userPrizeService);
userProgressService.setFollowService(followService);
userProgressService.setLeaderboardService(leaderboardService);

badgeService.setUserPrizeService(userPrizeService);
userPrizeService.setUserProgressService(userProgressService);

router.get("/api/userprogress-list", verifyAdmin, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const role = req.user.role || "user";
    const search = req.query.search || "";
    const { userprogresses, totalUserProgresses } = await userProgressService.getUserProgressList(page, limit, search, role);
    const totalPages = Math.ceil(totalUserProgresses / limit);
    res.json({
        userprogresses,
        currentPage: page,
        totalPages,
    });
}));

router.get("/streak", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    res.json({
        streak: userProgress?.streak || 0,
        maxStreak: userProgress?.maxStreak || 0,
        lastStudyDate: userProgress?.lastStudyDate,
        studyDates: userProgress?.studyDates || []
    });
}));

router.get("/experiencepoint", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    res.json({
        experiencePoints: userProgress?.experiencePoints || 0
    });
}));

router.get("/diamonds", verifyToken, asyncHandler(async (req, res) => {
    const diamonds = await userProgressService.getDiamonds(req.user.id);
    res.json({ success: true, diamonds });
}));

router.get("/dailyreviews", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    res.json({
        dailyFlashcardReviews: userProgress?.dailyFlashcardReviews || {}
    });
}));

router.get("/daily-goal", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const goal = await badgeService.getDailyFlashcardGoal(userId);
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    const todayStr = getVietnamDate();
    const todayCount = userProgress?.dailyFlashcardReviews?.[todayStr] || 0;
    res.json({
        goal,
        todayCount,
        isAchieved: todayCount >= goal
    });
}));

router.post("/update-goal", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { goal } = req.body;
    const result = await badgeService.updateDailyFlashcardGoal(userId, goal);
    res.json({ success: true, goal });
}));

router.get("/badges", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const status = await badgeService.getMonthlyBadgesStatus(userId);
    res.json(status);
}));

router.post("/study-time", verifyToken, asyncHandler(async (req, res) => {
    const { seconds } = req.body;
    const userId = req.user.id;
    if(!seconds || seconds <= 0) {
        return res.status(400).json({ success: false, message: "Invalid time" });
    }
    await userProgressService.recordStudyTime(userId, seconds);
    res.json({ success: true });
}));

router.get("/leaderboard", verifyToken, asyncHandler(async (req, res) => {
    const { type = 'exp', period = 'all', limit = 50 } = req.query;
    const data = await leaderboardService.getLeaderboard(type, period, parseInt(limit));
    res.json({ success: true, data });
}));

router.get("/api/current", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    if(!userProgress) {
        return res.status(404).json({ message: "Không tìm thấy tiến trình của người dùng." });
    }
    res.json(userProgress);
}));

router.get("/statistics", verifyToken, asyncHandler(async (req, res) => {
    const { type = 'time', period = 'week' } = req.query;
    const userId = req.user.id;
    const data = await leaderboardService.getUserStatistics(userId, type, period);
    res.json({ success: true, data });
}));

router.get("/my-prizes", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const prizes = await userPrizeService.getUserPrizesWithDetails(userId);
    res.json({ success: true, prizes });
}));

router.get("/champion-stats", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stats = await userPrizeService.getChampionStats(userId);
    res.json({ success: true, stats });
}));

router.get("/api/userprogress/by-user/:userId", verifyToken, asyncHandler(async (req, res) => {
    const progress = await userProgressService.getDetailUserProgressByUserId(req.params.userId);
    if(!progress) {
        return res.status(404).json({ message: "Không tìm thấy tiến trình người dùng" });
    }
    res.json(progress);
}));

router.post("/follow/:targetUserId", verifyToken, asyncHandler(async (req, res) => {
    const followerId = req.user.id;
    const targetId = req.params.targetUserId;
    if(followerId === targetId) {
        return res.status(400).json({ success: false, message: "Không thể tự theo dõi!" });
    }
    const alreadyFollowing = await followService.isFollowing(followerId, targetId);
    if(alreadyFollowing) {
        return res.json({ success: true, message: "Đã theo dõi rồi!", alreadyFollowing: true });
    }
    await followService.followUser(followerId, targetId);
    res.json({ success: true, message: "Đã theo dõi thành công!" });
}));

router.post("/unfollow/:targetUserId", verifyToken, asyncHandler(async (req, res) => {
    const followerId = req.user.id;
    const targetId = req.params.targetUserId;
    const isFollow = await followService.isFollowing(followerId, targetId);
    if(!isFollow) {
        return res.json({ success: true, message: "Chưa theo dõi để hủy!", alreadyUnfollowed: true });
    }
    await followService.unfollowUser(followerId, targetId);
    res.json({ success: true, message: "Đã hủy theo dõi!" });
}));

router.get("/is-following/:targetUserId", verifyToken, asyncHandler(async (req, res) => {
    try {
        const followerId = req.user.id;
        const targetId = req.params.targetUserId;
        const isFollow = await followService.isFollowing(followerId, targetId);
        res.json({ isFollow });
    } catch (err) {
        res.json({ isFollow: false });
    }
}));

router.get("/followers-count/:userId", verifyToken, asyncHandler(async (req, res) => {
    try {
        const count = await followService.getFollowersCount(req.params.userId);
        res.json({ count });
    } catch (err) {
        res.json({ count: 0 });
    }
}));

router.get("/following-count/:userId", verifyToken, asyncHandler(async (req, res) => {
    try {
        const count = await followService.getFollowingCount(req.params.userId);
        res.json({ count });
    } catch (err) {
        res.json({ count: 0 });
    }
}));

router.get("/follow-stats/:userId", verifyToken, asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const targetId = req.params.userId;
    const [isFollow, followersCount, followingCount] = await Promise.all([
        followService.isFollowing(currentUserId, targetId),
        followService.getFollowersCount(targetId),
        followService.getFollowingCount(targetId)
    ]);
    res.json({ isFollowing: isFollow, followersCount, followingCount });
}));

router.get("/followers-list/:userId", verifyToken, asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;
    const users = await followService.getFollowersList(targetUserId);
    res.json({ users });
}));

router.get("/following-list/:userId", verifyToken, asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;
    const users = await followService.getFollowingList(targetUserId);
    res.json({ users });
}));

router.get("/api/userprogress/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const userProgressId = req.params.id;
    const userProgress = await userProgressService.getUserProgress(userProgressId);
    if(!userProgress) {
        return res.status(404).json({ message: "Không tìm thấy tiến trình của người dùng." });
    }
    res.json(userProgress);
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const userprogress = await userProgressService.getUserProgress(req.params.id);
    if(!userprogress) {
        return res.status(404).json({ message: "Tiến trình của người dùng không tìm thấy." });
    }
    const result = await userProgressService.deleteUserProgress(req.params.id);
    if(!result || result.deletedCount == 0) {
        return res.status(404).json({ success: false, message: "Tiến trình của người dùng không tìm thấy." });
    }
    res.json({ success: true, message: "Tiến trình của người dùng đã xóa thành công !" });
}));

module.exports = router;
module.exports.setUserProgressService = (service) => {
    userProgressService = service;
};
module.exports.setBadgeService = (service) => {
    badgeService = service;
};
module.exports.setStreakService = (service) => {
    streakService = service;
};
module.exports.setUserPrizeService = (service) => {
    userPrizeService = service;
};
module.exports.setLeaderboardService = (service) => {
    leaderboardService = service;
};
module.exports.setFollowService = (service) => {
    followService = service;
};