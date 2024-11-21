var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var StoryService = require("./../../services/storyService");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", function (req, res) {
    res.render("stories/story");
});

router.get("/add", function (req, res) {
    res.render("stories/addstory");
});

router.get("/update", async function (req, res) {
    const storyService = new StoryService();
    const story = await storyService.getStory(req.query.id);
    res.render("stories/updatestory", { story });
});

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

router.post("/api/add", upload.single("image"), async function (req, res) {
    const storyService = new StoryService();

    try {
        const stories = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            images: req.file ? req.file.buffer : null
        };
        const result = await storyService.insertStory(stories);
        res.status(201).json({ message: "Câu chuyện đã được thêm thành công !", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding story", error });
    }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    const storyService = new StoryService();
    try {
        const stories = {
            _id: new ObjectId(req.params.id),
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
        };
        if (req.file) {
            stories.images = req.file.buffer;
        } else {
            const existingStory = await storyService.getStory(req.params.id);
            if (!existingStory) {
            return res.status(404).json({ message: "Câu chuyện không tìm thấy." });
            }
            stories.images = existingStory.images;
        }
        const result = await storyService.updateStory(stories);
        res.json({ message: "Câu chuyện đã được cập nhật thành công !", result });
    } catch (error) {
        res.status(500).json({ message: "Error updating story", error });
    }
});

router.delete("/api/story/:id", async function (req, res) {
    const storyService = new StoryService();
    const result = await storyService.deleteStory(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Câu chuyện không tìm thấy." });
    }
    res.json({ message: "Câu chuyện đã xóa thành công !" });
});

module.exports = router;