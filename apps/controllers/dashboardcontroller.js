const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const DashboardService = require("../services/dashboardService");
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

module.exports = router;