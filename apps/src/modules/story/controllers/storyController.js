const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require('../../../shared/middleware/cacheMiddleware');
const StoryService = require("../services/storyService");
const { validateStoryInput, buildStoryDataFromRequest } = require("../validators/storyValidator");

const storyService = new StoryService();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/api/story-list", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const category = req.query.category || "";
        const level = req.query.level || "";
        const search = req.query.search || "";
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
        const { status, data } = await storyService.getStoryDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error fetching story details:", error);
        res.status(500).json({ success: false, message: "Error fetching story details", error: error.message });
    }
});

router.get("/api/story/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const story = await storyService.getStoryBySlug(req.params.slug);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json({ data: story });
    } catch (err) {
        res.status(500).json({ message: "Error fetching story details", error: err.message });
    }
});

router.post("/api/story/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await storyService.completeStory(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing story:", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/api/add", verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const { status, data } = await storyService.insertStory(buildStoryDataFromRequest(req.body), req.file || null);
        res.status(status).json(data);
    } catch (err) {
        console.error("Add story error:", err);
        res.status(500).json({ success: false, message: "Error adding story", error: err.message });
    }
});

router.get("/api/:id", verifyAdmin, cacheMiddleware(600), async function (req, res) {
    try {
        const story = await storyService.getStory(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json(story);
    } catch (err) {
        console.error("Error fetching story:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/api/update/:id", verifyAdmin, upload.single("image"), async (req, res) => {
    try {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const { status, data } = await storyService.updateStory(req.params.id, buildStoryDataFromRequest(req.body), req.file || null);
        res.status(status).json(data);
    } catch (err) {
        console.error("Update story error:", err);
        res.status(500).json({ success: false, message: "Error updating story", error: err.message });
    }
});

router.delete("/api/story/:id", verifyAdmin, async (req, res) => {
    try {
        const { status, data } = await storyService.deleteStory(req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        console.error("Delete story error:", err);
        res.status(500).json({ success: false, message: "Error deleting story", error: err.message });
    }
});

module.exports = router;
