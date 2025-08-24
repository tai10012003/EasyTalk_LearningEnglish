const express = require("express");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const StoryService = require("./../../services/storyService");

const router = express.Router();
const storyService = new StoryService();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", (req, res) => {
    res.render("stories/story");
});

router.get("/add", (req, res) => {
    res.render("stories/addstory");
});

router.get("/update", async (req, res) => {
    try {
        const story = await storyService.getStory(req.query.id);
        if (!story) return res.status(404).send("Câu chuyện không tìm thấy.");
        res.render("stories/updatestory", { story });
    } catch (err) {
        res.status(500).send("Error retrieving story: " + err.message);
    }
});

router.get("/api/story-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const { stories, totalStory } = await storyService.getStoryList(page, limit);
        const totalPages = Math.ceil(totalStory / limit);

        res.json({
            success: true,
            data: stories,
            currentPage: page,
            totalPages,
        });
    } catch (err) {
        console.error("Error fetching stories:", err);
        res.status(500).json({ success: false, message: "Error fetching stories", error: err.message });
    }
});

router.post("/api/add", upload.single("image"), async (req, res) => {
    try {
        const { title, description, content, level, category } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ success: false, message: "Tiêu đề không được để trống." });
        }
        if (!content || !Array.isArray(JSON.parse(content)) || JSON.parse(content).length === 0) {
            return res.status(400).json({ success: false, message: "Nội dung câu chuyện không hợp lệ." });
        }

        const storyData = {
            title,
            description,
            level,
            category,
            image: req.file ? req.file.buffer : "",
            content: JSON.parse(content),
        };

        const result = await storyService.insertStory(storyData);
        res.status(201).json({ success: true, message: "Câu chuyện đã được thêm thành công!", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error adding story", error: err.message });
    }
});

router.put("/api/update/:id", upload.single("image"), async (req, res) => {
    try {
        const { title, description, content, level, category } = req.body;
        const storyId = req.params.id;

        if (!title || title.trim() === "") {
            return res.status(400).json({ success: false, message: "Tiêu đề không được để trống." });
        }
        if (!content || !Array.isArray(JSON.parse(content)) || JSON.parse(content).length === 0) {
            return res.status(400).json({ success: false, message: "Nội dung câu chuyện không hợp lệ." });
        }

        const existingStory = await storyService.getStory(storyId);
        if (!existingStory) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });

        const storyData = {
            _id: storyId,
            title,
            description,
            level,
            category,
            content: JSON.parse(content),
            image: req.file ? req.file.buffer : existingStory.image,
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
        const result = await storyService.deleteStory(req.params.id);
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Câu chuyện không tìm thấy." });
        res.json({ success: true, message: "Câu chuyện đã xóa thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting story", error: err.message });
    }
});

module.exports = router;