const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { UserprogressService } = require("./../services");
const userprogressService = new UserprogressService();

router.get("/api/userprogress/streak", verifyToken, async (req, res) => {
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

router.get("/api/userprogress/experiencepoint", verifyToken, async (req, res) => {
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

module.exports = router;