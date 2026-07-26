const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const DashboardService = require("../services/dashboardService");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

let dashboardService = null;

function setRepositories(userRepository, userProgressRepository) {
    dashboardService = new DashboardService(userRepository, userProgressRepository);
}

router.get("/user-activity", verifyAdmin, asyncHandler(async (req, res) => {
    const activityData = await dashboardService.getUserActivityLast7Days();
    res.json({ success: true, data: activityData });
}));

router.get("/overview", verifyAdmin, asyncHandler(async (req, res) => {
    const overview = await dashboardService.getDashboardOverview();
    res.json({ success: true, data: overview });
}));

router.get("/security-overview", verifyAdmin, asyncHandler(async (req, res) => {
    const securityOverview = await dashboardService.getSecurityOverview();
    res.json({ success: true, data: securityOverview });
}));

router.get("/agent-debug", verifyAdmin, asyncHandler(async (req, res) => {
    const agentDebug = await dashboardService.getAgentDebugOverview();
    res.json({ success: true, data: agentDebug });
}));

router.get("/lesson-breakdown", verifyAdmin, asyncHandler(async (req, res) => {
    const lessonBreakdown = await dashboardService.getLessonBreakdown();
    res.json({ success: true, data: lessonBreakdown });
}));

router.get("/exercise-breakdown", verifyAdmin, asyncHandler(async (req, res) => {
    const exerciseBreakdown = await dashboardService.getExerciseBreakdown();
    res.json({ success: true, data: exerciseBreakdown });
}));

router.get("/recent-activities", verifyAdmin, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await dashboardService.getRecentActivities(limit);
    res.json({ success: true, data: activities });
}));

router.get("/top-users-exp", verifyAdmin, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = await dashboardService.getTopUsersByExp(limit);
    res.json({ success: true, data: topUsers });
}));

router.get("/top-users-study-time", verifyAdmin, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = await dashboardService.getTopUsersByStudyTime(limit);
    res.json({ success: true, data: topUsers });
}));

router.get("/top-users-streak", verifyAdmin, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = await dashboardService.getTopUsersByStreak(limit);
    res.json({ success: true, data: topUsers });
}));

router.get("/lesson-completion-stats", verifyAdmin, asyncHandler(async (req, res) => {
    const stats = await dashboardService.getLessonCompletionStats();
    res.json({ success: true, data: stats });
}));

router.get("/exercise-completion-stats", verifyAdmin, asyncHandler(async (req, res) => {
    const stats = await dashboardService.getExerciseCompletionStats();
    res.json({ success: true, data: stats });
}));

router.get("/most-popular-lessons", verifyAdmin, asyncHandler(async (req, res) => {
    const lessons = await dashboardService.getMostPopularLessons();
    res.json({ success: true, data: lessons });
}));

router.get("/most-popular-exercises", verifyAdmin, asyncHandler(async (req, res) => {
    const exercises = await dashboardService.getMostPopularExercises();
    res.json({ success: true, data: exercises });
}));

router.get("/least-popular-lessons", verifyAdmin, asyncHandler(async (req, res) => {
    const lessons = await dashboardService.getLeastPopularLessons();
    res.json({ success: true, data: lessons });
}));

router.get("/least-popular-exercises", verifyAdmin, asyncHandler(async (req, res) => {
    const exercises = await dashboardService.getLeastPopularExercises();
    res.json({ success: true, data: exercises });
}));

module.exports = router;
module.exports.setRepositories = setRepositories;
