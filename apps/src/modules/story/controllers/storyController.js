const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require('../../../shared/middleware/cacheMiddleware');
const StoryService = require("../services/storyService");
const UserProgressService = require("../../userprogress/services/userprogressService");
const { validateStoryInput, parseContent, validateContent } = require("../validators/storyValidator");

const storyService = new StoryService();
const userProgressService = new UserProgressService();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/api/story-list", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const category = req.query.category;
        const level = req.query.level;
        const search = req.query.search;
        const role = req.user.role || "user";
        const { stories, totalStory } = await storyService.getStoryList(page, limit, category, level, search, role);
        const totalPages = Math.ceil(totalStory / limit);
        res.json({ success: true, data: stories, currentPage: page, totalPages });
    } catch (error) {
        console.error("Error fetching stories:", error);
        res.status(500).json({ success: false, message: "Error fetching stories", error: error.message });
    }
});

router.get("/api/story/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;
        const story = await storyService.getStory(storyId);
        if (!story) return res.status(404).json({ success: false, message: "Story not found" });
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await storyService.getStoryList(1, 1);
            const firstStory = firstPage?.stories?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, firstStory?._id, null, null);
        }
        const isUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This story is locked for you. Please complete previous stories first." });
        }
        res.json({ success: true, data: story, userProgress });
    } catch (error) {
        console.error("Error fetching story details:", error);
        res.status(500).json({ success: false, message: "Error fetching story details", error: error.message });
    }
});

router.get("/api/story/slug/:slug", verifyToken, cacheMiddleware(300), async function(req, res) {
    try {
        const story = await storyService.getStoryBySlug(req.params.slug);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json({ data: story });
    } catch (err) {
        res.status(500).json({ message: "Error fetching story details", error: err });
    }
});

router.post("/api/story/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storyId = req.params.id;
        const story = await storyService.getStory(storyId);
        if (!story) return res.status(404).json({ success: false, message: "Story not found" });
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await storyService.getStoryList(1, 1);
            const firstStory = firstPage?.stories?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, firstStory?._id || null, null, null);
        }
        const isUnlocked = (userProgress.unlockedStories || []).some(s => s.toString() == storyId.toString());
        if (!isUnlocked) return res.status(403).json({ success: false, message: "You cannot complete a locked story." });
        const all = await storyService.getStoryList(1, 10000);
        const allStories = all?.stories || [];
        const idx = allStories.findIndex(s => s._id.toString() == storyId.toString());
        let nextStory = null;
        if (idx !== -1 && idx < allStories.length - 1) nextStory = allStories[idx + 1];
        if (nextStory) {
            userProgress = await userProgressService.unlockNextStory(userProgress, nextStory._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextStory ? "Story completed. Next story unlocked." : "Story completed. You have finished all stories.",
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

router.post("/api/add", upload.single("image"), async (req, res) => {
    try {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const content = parseContent(req.body.content);
        const contentValidation = validateContent(content);
        if (!contentValidation.valid) return res.status(400).json({ success: false, message: contentValidation.error });
        const storyData = {
            title: req.body.title,
            description: req.body.description,
            level: req.body.level,
            category: req.body.category,
            image: req.body.image || null,
            content,
            slug: req.body.slug,
            sort: parseInt(req.body.sort) || 0,
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await storyService.insertStory(storyData, req.file || null);
        res.status(201).json({ success: true, message: "Câu chuyện đã được thêm thành công!", result });
    } catch (err) {
        console.error("Add story error:", err);
        res.status(500).json({ success: false, message: "Error adding story", error: err.message });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const story = await storyService.getStory(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json(story);
    } catch (err) {
        console.error("Error fetching story:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/api/update/:id", upload.single("image"), async (req, res) => {
    try {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const content = parseContent(req.body.content);
        const contentValidation = validateContent(content);
        if (!contentValidation.valid) return res.status(400).json({ success: false, message: contentValidation.error });
        const existingStory = await storyService.getStory(req.params.id);
        if (!existingStory) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        const storyData = {
            _id: req.params.id,
            title: req.body.title,
            description: req.body.description,
            level: req.body.level,
            category: req.body.category,
            content,
            image: existingStory.image || req.body.image || "",
            slug: req.body.slug,
            sort: parseInt(req.body.sort) || 0,
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await storyService.updateStory(storyData, req.file || null);
        res.json({ success: true, message: "Câu chuyện đã được cập nhật thành công!", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating story", error: err.message });
    }
});

router.delete("/api/story/:id", async (req, res) => {
    try {
        const story = await storyService.getStory(req.params.id);
        if(!story) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        const result = await storyService.deleteStory(req.params.id);
        if(!result || result.deletedCount == 0) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        res.json({ success: true, message: "Câu chuyện đã xóa thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting story", error: err.message });
    }
});

module.exports = router;