const express = require("express");
const router = express.Router();
const StoryService = require("./../services/storyService");
const storyService = new StoryService();

router.get("/api/story-list", async (req, res) => {
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

router.get("/", (req, res) => {
    res.render("stories/story-list");
});

router.get("/detail/:id", (req, res) => {
    res.render("stories/story-detail");
});

router.get("/api/story/:id", async (req, res) => {
    try {
        const story = await storyService.getStory(req.params.id);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found",
            });
        }

        res.json({
            success: true,
            data: story,
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

module.exports = router;