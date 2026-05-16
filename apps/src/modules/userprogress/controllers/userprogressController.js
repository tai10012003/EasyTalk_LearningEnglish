const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const { getVietnamDate } = require('../../../shared/utils/dateFormat');

const UserProgressService = require('../services/userprogressService');
const BadgeService = require('../services/badgeService');
const StreakService = require('../services/streakService');
const UserPrizeService = require('../services/userprizeService');
const LeaderboardService = require('../services/leaderboardService');
const FollowService = require('../services/followService');

const userProgressService = new UserProgressService();
const badgeService = new BadgeService();
const streakService = new StreakService();
const userPrizeService = new UserPrizeService();
const leaderboardService = new LeaderboardService();
const followService = new FollowService();

userProgressService.setBadgeService(badgeService);
userProgressService.setStreakService(streakService);
userProgressService.setUserPrizeService(userPrizeService);
userProgressService.setFollowService(followService);
userProgressService.setLeaderboardService(leaderboardService);

badgeService.setUserPrizeService(userPrizeService);
userPrizeService.setUserProgressService(userProgressService);

router.get("/api/userprogress-list", verifyToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    try {
        const role = req.user.role || "user";
        const search = req.query.search || "";
        const { userprogresses, totalUserProgresses } = await userProgressService.getUserProgressList(page, limit, search, role);
        const totalPages = Math.ceil(totalUserProgresses / limit);
        res.json({
            userprogresses,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error("Error fetching userprogress list:", err);
        res.status(500).json({ message: "Error fetching userprogress list", error: err });
    }
});

router.get("/streak", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userProgressService.getUserProgressByUserId(userId);
        res.json({
            streak: userProgress?.streak || 0,
            maxStreak: userProgress?.maxStreak || 0,
            lastStudyDate: userProgress?.lastStudyDate,
            studyDates: userProgress?.studyDates || []
        });
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/experiencepoint", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userProgressService.getUserProgressByUserId(userId);
        res.json({
            experiencePoints: userProgress?.experiencePoints || 0
        });
    } catch (error) {
        console.error('Error fetching experience points:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/diamonds", verifyToken, async (req, res) => {
    try {
        const diamonds = await userProgressService.getDiamonds(req.user.id);
        res.json({ success: true, diamonds });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.get("/dailyreviews", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userProgressService.getUserProgressByUserId(userId);
        res.json({
            dailyFlashcardReviews: userProgress?.dailyFlashcardReviews || {}
        });
    } catch (error) {
        console.error('Error fetching daily reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/daily-goal", verifyToken, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching daily goal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/update-goal", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { goal } = req.body;
        const result = await badgeService.updateDailyFlashcardGoal(userId, goal);
        res.json({ success: true, goal });
    } catch (error) {
        console.error('Error updating daily goal:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/badges", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await badgeService.getMonthlyBadgesStatus(userId);
        res.json(status);
    } catch (error) {
        console.error("Error fetching badges:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/study-time", verifyToken, async (req, res) => {
    try {
        const { seconds } = req.body;
        const userId = req.user.id;
        if(!seconds || seconds <= 0) {
            return res.status(400).json({ success: false, message: "Invalid time" });
        }
        await userProgressService.recordStudyTime(userId, seconds);
        res.json({ success: true });
    } catch (err) {
        console.error("Error recording study time:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/leaderboard", verifyToken, async (req, res) => {
    try {
        const { type = 'exp', period = 'all', limit = 50 } = req.query;
        const data = await leaderboardService.getLeaderboard(type, period, parseInt(limit));
        res.json({ success: true, data });
    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/api/current", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userProgressService.getUserProgressByUserId(userId);
        if(!userProgress) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình của người dùng." });
        }
        res.json(userProgress);
    } catch (error) {
        console.error("Lỗi khi lấy tiến trình user hiện tại:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
});

router.get("/statistics", verifyToken, async (req, res) => {
    try {
        const { type = 'time', period = 'week' } = req.query;
        const userId = req.user.id;
        const data = await leaderboardService.getUserStatistics(userId, type, period);
        res.json({ success: true, data });
    } catch (err) {
        console.error("Statistics error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/my-prizes", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const prizes = await userPrizeService.getUserPrizesWithDetails(userId);
        res.json({ success: true, prizes });
    } catch (error) {
        console.error("Error fetching user prizes:", error);
        res.status(500).json({ success: false, message: "Error fetching prizes" });
    }
});

router.get("/champion-stats", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await userPrizeService.getChampionStats(userId);
        res.json({ success: true, stats });
    } catch (error) {
        console.error("Error fetching champion stats:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy thống kê quán quân" });
    }
});

router.get("/api/userprogress/by-user/:userId", verifyToken, async (req, res) => {
    try {
        const progress = await userProgressService.getDetailUserProgressByUserId(req.params.userId);
        if(!progress) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình người dùng" });
        }
        res.json(progress);
    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

router.post("/follow/:targetUserId", verifyToken, async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

router.post("/unfollow/:targetUserId", verifyToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const targetId = req.params.targetUserId;
        const isFollow = await followService.isFollowing(followerId, targetId);
        if(!isFollow) {
            return res.json({ success: true, message: "Chưa theo dõi để hủy!", alreadyUnfollowed: true });
        }
        await followService.unfollowUser(followerId, targetId);
        res.json({ success: true, message: "Đã hủy theo dõi!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

router.get("/is-following/:targetUserId", verifyToken, async (req, res) => {
    try {
        const followerId = req.user.id;
        const targetId = req.params.targetUserId;
        const isFollow = await followService.isFollowing(followerId, targetId);
        res.json({ isFollow });
    } catch (err) {
        res.json({ isFollow: false });
    }
});

router.get("/followers-count/:userId", verifyToken, async (req, res) => {
    try {
        const count = await followService.getFollowersCount(req.params.userId);
        res.json({ count });
    } catch (err) {
        res.json({ count: 0 });
    }
});

router.get("/following-count/:userId", verifyToken, async (req, res) => {
    try {
        const count = await followService.getFollowingCount(req.params.userId);
        res.json({ count });
    } catch (err) {
        res.json({ count: 0 });
    }
});

router.get("/follow-stats/:userId", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetId = req.params.userId;
        const [isFollow, followersCount, followingCount] = await Promise.all([
            followService.isFollowing(currentUserId, targetId),
            followService.getFollowersCount(targetId),
            followService.getFollowingCount(targetId)
        ]);
        res.json({ isFollowing: isFollow, followersCount, followingCount });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server" });
    }
});

router.get("/followers-list/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const users = await followService.getFollowersList(targetUserId);
        res.json({ users });
    } catch (err) {
        console.error("Error fetching followers list:", err);
        res.status(500).json({ users: [] });
    }
});

router.get("/following-list/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const users = await followService.getFollowingList(targetUserId);
        res.json({ users });
    } catch (err) {
        console.error("Error fetching following list:", err);
        res.status(500).json({ users: [] });
    }
});

router.get("/api/userprogress/:id", verifyToken, async (req, res) => {
    try {
        const userProgressId = req.params.id;
        const userProgress = await userProgressService.getUserProgress(userProgressId);
        if(!userProgress) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình của người dùng." });
        }
        res.json(userProgress);
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết userprogress:", error);
        res.status(500).json({ message: "Lỗi server khi lấy chi tiết userprogress." });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const userprogress = await userProgressService.getUserProgress(req.params.id);
        if(!userprogress) {
            return res.status(404).json({ message: "Tiến trình của người dùng không tìm thấy." });
        }
        const result = await userProgressService.deleteUserProgress(req.params.id);
        if(!result || result.deletedCount == 0) {
            return res.status(404).json({ success: false, message: "Tiến trình của người dùng không tìm thấy." });
        }
        res.json({ success: true, message: "Tiến trình của người dùng đã xóa thành công !" });
    } catch (error) {
        console.error("Delete user progress error:", error);
        res.status(500).json({ message: "Error deleting user progress", error: error.message });
    }
});

module.exports = router;