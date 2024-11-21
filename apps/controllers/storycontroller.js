const express = require("express");
const router = express.Router();
const StoryService = require("./../services/storyService");

router.get("/api/story-list", async function (req, res) {
    const storyService = new StoryService();
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const { stories, totalStory } = await storyService.getStoryList(page, limit);
    const totalPages = Math.ceil(totalStory / limit);
    res.json({
      stories,
      currentPage: page,
      totalPages,
    });
});
  
router.get('/', (req, res) => {
    res.render('stories/story-list');
});

router.get('/detail/:id', (req, res) => {
  res.render('stories/story-detail');
});

router.get("/api/:id", async function (req, res) {
  const storyService = new StoryService();
  try {
    const story = await storyService.getStory(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "story not found" });
    }

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: "Error fetching story details", error: err });
  }
});

module.exports = router;
