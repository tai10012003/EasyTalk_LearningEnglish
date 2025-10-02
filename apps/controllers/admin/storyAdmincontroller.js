const express = require("express");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const StoryService = require("./../../services/storyService");
const router = express.Router();
const storyService = new StoryService();

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