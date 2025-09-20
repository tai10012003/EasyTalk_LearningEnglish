const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const UserProgressService = require("./../services/userprogressService");
const userProgressService = new UserProgressService();

router.get("/api/userprogress/streak", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const userProgress = await userProgressService.getUserProgressByUserId(userId);
    res.json({
        streak: userProgress.streak || 0,
        maxStreak: userProgress.maxStreak || 0,
        lastStudyDate: userProgress.lastStudyDate,
        studyDates: userProgress.studyDates || []
    });
});
module.exports = router;