const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("./../util/VerifyToken");
const { StoryService, UserprogressService } = require("./../services");
const storyService = new StoryService();
const userprogressService = new UserprogressService();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storyService.imageFolder);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const newName = storyService.getNextImageFilename(ext);
        cb(null, newName);
    },
});

const upload = multer({ storage });

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

router.post("/api/add", upload.single("image"), async (req, res) => {
    try {
        const { title, description, content, level, category } = req.body;
        if (!title || title.trim() == "") {
            return res.status(400).json({ success: false, message: "Tiêu đề không được để trống." });
        }
        if (!content || !Array.isArray(JSON.parse(content)) || JSON.parse(content).length == 0) {
            return res.status(400).json({ success: false, message: "Nội dung câu chuyện không hợp lệ." });
        }
        const storyData = {
            title,
            description,
            level,
            category,
            image: req.file ? `/static/images/story/${req.file.filename}` : null,
            content: JSON.parse(content),
        };
        const result = await storyService.insertStory(storyData);
        res.status(201).json({ success: true, message: "Câu chuyện đã được thêm thành công!", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error adding story", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const story = await storyService.getStory(req.params.id);
        if (!story) {
            return res.status(404).json({ message: "Story not found" });
        }
        res.json(story);
    } catch (err) {
        console.error("Error fetching story:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/api/update/:id", upload.single("image"), async (req, res) => {
    try {
        const { title, description, content, level, category } = req.body;
        const storyId = req.params.id;
        if (!title || title.trim() == "") {
            return res.status(400).json({ success: false, message: "Tiêu đề không được để trống." });
        }
        if (!content || !Array.isArray(JSON.parse(content)) || JSON.parse(content).length == 0) {
            return res.status(400).json({ success: false, message: "Nội dung câu chuyện không hợp lệ." });
        }
        const existingStory = await storyService.getStory(storyId);
        if (!existingStory) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        let imagePath = existingStory.image || "";
        if (req.file) {
            if (existingStory.image) {
                const oldFilename = path.basename(existingStory.image);
                const oldFilePath = path.join(storyService.imageFolder, oldFilename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
                const ext = path.extname(req.file.originalname);
                const newFilePath = path.join(storyService.imageFolder, oldFilename);
                fs.renameSync(req.file.path, newFilePath);
                imagePath = `/static/images/story/${oldFilename}`;
            } else {
                imagePath = `/static/images/story/${req.file.filename}`;
            }
        }
        const storyData = {
            _id: storyId,
            title,
            description,
            level,
            category,
            content: JSON.parse(content),
            image: imagePath,
        };
        const result = await storyService.updateStory(storyData);
        res.json({ success: true, message: "Câu chuyện đã được cập nhật thành công!", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating story", error: err.message });
    }
});

router.delete("/api/story/:id", async (req, res) => {
    try {
        const story = await storyService.getStory(req.params.id);
        if (!story) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        if (story.image) {
            const filePath = path.join(storyService.imageFolder, path.basename(story.image));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        const result = await storyService.deleteStory(req.params.id);
        if (result.deletedCount == 0) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        res.json({ success: true, message: "Câu chuyện đã xóa thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting story", error: err.message });
    }
});

module.exports = router;