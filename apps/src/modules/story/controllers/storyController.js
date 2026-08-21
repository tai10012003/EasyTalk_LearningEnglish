const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const StoryService = require("../services/storyService");
const { validateStoryInput, buildStoryDataFromRequest } = require("../validators/storyValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

let storyService = new StoryService();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/api/story-list", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const category = req.query.category || "";
        const level = req.query.level || "";
        const search = req.query.search || "";
        const role = req.user.role || "user";
        const lang = req.query.lang || "vi";
        const { stories, totalStory } = await storyService.getStoryList(page, limit, category, level, search, role, lang);
        const totalPages = Math.ceil(totalStory / limit);
        res.json({ success: true, data: stories, currentPage: page, totalPages });
}));

router.get("/api/story/roadmap", verifyToken, asyncHandler(async (req, res) => {
        const lang = req.query.lang || "vi";
        const { status, data } = await storyService.getStoryRoadmap(req.user.id, lang);
        return res.status(status).json(data);
}));

router.get("/api/story/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await storyService.getStoryDetails(req.user.id, req.params.id, req.query.lang || "vi");
        return res.status(status).json(data);
}));

router.get("/api/story/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const { status, data } = await storyService.getStoryDetailsBySlug(req.user.id, req.params.slug, req.query.lang || "vi");
        return res.status(status).json(data);
}));

router.post("/api/story/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await storyService.completeStory(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/api/add", verifyAdmin, upload.single("image"), asyncHandler(async (req, res) => {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const { status, data } = await storyService.insertStory(buildStoryDataFromRequest(req.body), req.file || null);
        res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const story = await storyService.getStory(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });
        res.json(story);
}));

router.put("/api/update/:id", verifyAdmin, upload.single("image"), asyncHandler(async (req, res) => {
        const validation = validateStoryInput(req.body);
        if (!validation.valid) return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        const { status, data } = await storyService.updateStory(req.params.id, buildStoryDataFromRequest(req.body), req.file || null);
        res.status(status).json(data);
}));

router.delete("/api/story/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const { status, data } = await storyService.deleteStory(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;
module.exports.setStoryService = (service) => {
    storyService = service;
};
