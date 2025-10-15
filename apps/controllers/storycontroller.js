const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { StoryService, UserprogressService } = require("./../services");
const storyService = new StoryService();
const userprogressService = new UserprogressService();

router.get("/api/story-list", verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const category = req.query.category;
        const level = req.query.level;
        const search = req.query.search;
        const { stories, totalStory } = await storyService.getStoryList(page, limit, category, level, search);
        const totalPages = Math.ceil(totalStory / limit);
        res.json({
            success: true,
            data: stories,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching stories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching stories",
            error: error.message,
        });
    }
});

router.get("/api/story/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;
        const story = await storyService.getStory(storyId);
        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await storyService.getStoryList(1, 1);
            const firstStory = (firstPage && firstPage.stories && firstPage.stories[0]) ? firstPage.stories[0] : null;
            userProgress = await userprogressService.createUserProgress(userId, null, firstStory ? firstStory._id : null, null, null);
        }
        const isUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This story is locked for you. Please complete previous stories first." });
        }
        res.json({
            success: true,
            data: story,
            userProgress: userProgress
        });
    } catch (error) {
        console.error("Error fetching story details:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching story details",
            error: error.message,
        });
    }
});

router.post("/api/story/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;
        const story = await storyService.getStory(storyId);
        if (!story) {
            return res.status(404).json({ success: false, message: "Story not found" });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await storyService.getStoryList(1, 1);
            const firstStory = firstPage?.stories?.[0] || null;
            userProgress = await userprogressService.createUserProgress(userId, null, firstStory?._id || null, null, null);
        }
        const isUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "You cannot complete a locked story." });
        }
        const all = await storyService.getStoryList(1, 10000);
        const allStories = all?.stories || [];
        const idx = allStories.findIndex(s => s._id.toString() == storyId.toString());
        let nextStory = null;
        if (idx !== -1 && idx < allStories.length - 1) {
            nextStory = allStories[idx + 1];
        }
        if (nextStory) {
            userProgress = await userprogressService.unlockNextStory(userProgress, nextStory._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userprogressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextStory
                ? "Story completed. Next story unlocked." 
                : "Story completed. You have finished all stories.",
            userProgress: {
                unlockedStories: updatedUserProgress.unlockedStories,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (error) {
        console.error("Error completing story:", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

module.exports = router;