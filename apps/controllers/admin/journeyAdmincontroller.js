const express = require("express");
const router = express.Router();
const Journey = require("../../models/journey");
const Gate = require("../../models/gate"); // Import model Gate

// Lấy danh sách Journey kèm theo số lượng Gates
router.get('/', async (req, res) => {
    try {
        const journeys = await Journey.find().populate('gates');
        res.render('journeys/journey', { journeys });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Thêm Journey mới thông qua AJAX
router.post("/add", (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    const newJourney = new Journey({
        title: title,
        gates: [], // Danh sách các Gate, hiện tại có thể để trống
        createdAt: new Date()
    });

    newJourney.save()
        .then(() => {
            return res.status(200).json({ message: "Journey added successfully!" });
        })
        .catch(err => {
            return res.status(500).json({ error: "Failed to add Journey." });
        });
});

// Cập nhật Journey
router.post("/update/:id", (req, res) => {
    const updateData = {
        title: req.body.title
    };

    Journey.findByIdAndUpdate(req.params.id, updateData)
        .then(() => res.status(200).json({ message: "Journey updated successfully!" }))
        .catch(err => res.status(500).json({ error: "Failed to update Journey." }));
});

// Xóa Journey và tất cả các Gate liên quan
router.post("/delete/:id", async (req, res) => {
    try {
        const journeyId = req.params.id;

        // Xóa tất cả các Gate liên quan đến Journey
        await Gate.deleteMany({ journey: journeyId });

        // Xóa Journey
        await Journey.findByIdAndDelete(journeyId);

        res.status(200).json({ message: "Journey and related Gates deleted successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete Journey and related Gates." });
    }
});

module.exports = router;
