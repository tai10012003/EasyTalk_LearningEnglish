const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { UserprogressService } = require("./../services");
const userprogressService = new UserprogressService();

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

module.exports = router;