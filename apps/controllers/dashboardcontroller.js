const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { DashboardService } = require("../services");
const dashboardService = new DashboardService();

router.get("/user-activity", verifyToken, async (req, res) => {
    try {
        const activityData = await dashboardService.getUserActivityLast7Days();
        res.json({ success: true, data: activityData });
    } catch (error) {
        console.error("Error fetching user activity:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy dữ liệu hoạt động người dùng"
        });
    }
});

router.get("/overview", verifyToken, async (req, res) => {
    try {
        const overview = await dashboardService.getDashboardOverview();
        res.json({success: true, data: overview });
    } catch (error) {
        console.error("Error fetching dashboard overview:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy tổng quan dashboard"
        });
    }
});

router.get("/lesson-breakdown", verifyToken, async (req, res) => {
    try {
        const lessonBreakdown = await dashboardService.getLessonBreakdown();
        res.json({ success: true, data: lessonBreakdown });
    } catch (error) {
        console.error("Error fetching lesson breakdown:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy tỷ lệ bài học"
        });
    }
});

router.get("/exercise-breakdown", verifyToken, async (req, res) => {
    try {
        const exerciseBreakdown = await dashboardService.getExerciseBreakdown();
        res.json({ success: true, data: exerciseBreakdown });
    } catch (error) {
        console.error("Error fetching exercise breakdown:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy tỷ lệ bài luyện tập"
        });
    }
});

router.get("/recent-activities", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activities = await dashboardService.getRecentActivities(limit);
        res.json({ success: true, data: activities });
    } catch (error) {
        console.error("Error fetching recent activities:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy hoạt động gần đây"
        });
    }
});

router.get("/top-users-exp", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topUsers = await dashboardService.getTopUsersByExp(limit);
        res.json({ success: true, data: topUsers });
    } catch (error) {
        console.error("Error fetching top users by exp:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bảng xếp hạng theo điểm kinh nghiệm"
        });
    }
});

router.get("/top-users-study-time", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topUsers = await dashboardService.getTopUsersByStudyTime(limit);
        res.json({ success: true, data: topUsers });
    } catch (error) {
        console.error("Error fetching top users by study time:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bảng xếp hạng theo thời gian học"
        });
    }
});

router.get("/top-users-streak", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const topUsers = await dashboardService.getTopUsersByStreak(limit);
        res.json({ success: true, data: topUsers });
    } catch (error) {
        console.error("Error fetching top users by streak:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bảng xếp hạng theo streak"
        });
    }
});

router.get("/lesson-completion-stats", verifyToken, async (req, res) => {
    try {
        const stats = await dashboardService.getLessonCompletionStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("Error fetching lesson completion stats:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy thống kê hoàn thành bài học"
        });
    }
});

router.get("/exercise-completion-stats", verifyToken, async (req, res) => {
    try {
        const stats = await dashboardService.getExerciseCompletionStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error("Error fetching exercise completion stats:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy thống kê hoàn thành bài tập"
        });
    }
});

router.get("/most-popular-lessons", verifyToken, async (req, res) => {
    try {
        const lessons = await dashboardService.getMostPopularLessons();
        res.json({ success: true, data: lessons });
    } catch (error) {
        console.error("Error fetching most popular lessons:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bài học phổ biến nhất"
        });
    }
});

router.get("/most-popular-exercises", verifyToken, async (req, res) => {
    try {
        const exercises = await dashboardService.getMostPopularExercises();
        res.json({ success: true, data: exercises });
    } catch (error) {
        console.error("Error fetching most popular exercises:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bài tập phổ biến nhất"
        });
    }
});

router.get("/least-popular-lessons", verifyToken, async (req, res) => {
    try {
        const lessons = await dashboardService.getLeastPopularLessons();
        res.json({ success: true, data: lessons });
    } catch (error) {
        console.error("Error fetching least popular lessons:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bài học khó nhất"
        });
    }
});

router.get("/least-popular-exercises", verifyToken, async (req, res) => {
    try {
        const exercises = await dashboardService.getLeastPopularExercises();
        res.json({ success: true, data: exercises });
    } catch (error) {
        console.error("Error fetching least popular exercises:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy bài tập khó nhất"
        });
    }
});

module.exports = router;