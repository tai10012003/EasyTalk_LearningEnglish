const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
// const { cacheMiddleware } = require("./../util/cacheMiddleware");
const { UserprogressService } = require("./../services");
const userprogressService = new UserprogressService();

router.get("/api/userprogress-list", verifyToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    try {
        const role = req.user.role || "user";
        const search = req.query.search || "";
        const { userprogresses, totalUserProgresses } = await userprogressService.getUserProgressList(page, limit, search, role);
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
        const userProgress = await userprogressService.getUserProgressByUserId(userId);
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
        const userProgress = await userprogressService.getUserProgressByUserId(userId);
        res.json({
            experiencePoints: userProgress?.experiencePoints || 0
        });
    } catch (error) {
        console.error('Error fetching experience points:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/dailyreviews", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userprogressService.getUserProgressByUserId(userId);
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
        const goal = await userprogressService.getDailyFlashcardGoal(userId);
        const userProgress = await userprogressService.getUserProgressByUserId(userId);
        const todayStr = new Date().toISOString().split('T')[0];
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
        const result = await userprogressService.updateDailyFlashcardGoal(userId, goal);
        res.json({ success: true, goal });
    } catch (error) {
        console.error('Error updating daily goal:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/badges", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await userprogressService.getMonthlyBadgesStatus(userId);
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
        if (!seconds || seconds <= 0) {
            return res.status(400).json({ success: false, message: "Invalid time" });
        }
        await userprogressService.recordStudyTime(userId, seconds);
        res.json({ success: true });
    } catch (err) {
        console.error("Error recording study time:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/leaderboard", verifyToken, async (req, res) => {
    try {
        const { type = 'exp', period = 'all', limit = 50 } = req.query;
        const data = await userprogressService.getLeaderboard(type, period, parseInt(limit));
        res.json({ success: true, data });
    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/api/current", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            return res.status(404).json({ message: "Không tìm thấy tiến trình của người dùng." });
        }
        res.json(userProgress);
    } catch (error) {
        console.error("Lỗi khi lấy tiến trình user hiện tại:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
});

router.get("/api/userprogress/:id", verifyToken, async (req, res) => {
    try {
        const userProgressId = req.params.id;
        const userProgress = await userprogressService.getUserProgress(userProgressId);
        if (!userProgress) {
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
        const userprogress = await userprogressService.getUserProgress(req.params.id);
        if (!userprogress) {
            return res.status(404).json({ message: "Tiến trình của người dùng không tìm thấy." });
        }
        const result = await userprogressService.deleteUserProgress(req.params.id);
        if (!result || result.deletedCount == 0) {
            return res.status(404).json({ success: false, message: "Tiến trình của người dùng không tìm thấy." });
        }
        res.json({ success: true, message: "Tiến trình của người dùng đã xóa thành công !" });
    } catch (error) {
        console.error("Delete user progress error:", error);
        res.status(500).json({ message: "Error deleting user progress", error: error.message });
    }
});

module.exports = router;