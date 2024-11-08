const express = require("express");
const router = express.Router();
const JourneyService = require("../../services/journeyService");
const GateService = require("../../services/gateService");
const gateService = new GateService();
const journeyService = new JourneyService(); // Khởi tạo dịch vụ JourneyService

router.get("/", function (req, res) {
    res.render('journeys/journey');
});

// API: Lấy danh sách các Journey có phân trang
router.get("/api/journey-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Đặt giới hạn số mục mỗi trang
        const { journeys, totalJourneys } = await journeyService.getJourneyList(page, limit);

        const totalPages = Math.ceil(totalJourneys / limit);

        res.json({
            journeys,
            currentPage: page,
            totalPages,
            totalJourneys
        });
    } catch (err) {
        console.error("Error retrieving journeys:", err);
        res.status(500).json({ error: "Failed to retrieve journeys." });
    }
});


// API: Thêm Journey mới thông qua AJAX
router.post("/add", async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }

    try {
        // Sử dụng JourneyService để thêm mới Journey
        const newJourney = await journeyService.insertJourney({
            title: title,
            gates: [], // Danh sách các Gate, hiện tại có thể để trống
            createdAt: new Date()
        });

        res.status(200).json({ message: "Journey added successfully!", journey: newJourney });
    } catch (err) {
        console.error("Error adding journey:", err);
        res.status(500).json({ error: "Failed to add Journey." });
    }
});

router.post("/update/:id", async (req, res) => {
    const journeyId = req.params.id;
    const updateData = { title: req.body.title }; // Chỉ lấy các trường cần cập nhật

    try {
        await journeyService.updateJourney({ _id: journeyId, ...updateData });
        res.status(200).json({ message: "Journey updated successfully!" });
    } catch (err) {
        console.error("Error updating journey:", err);
        res.status(500).json({ error: "Failed to update Journey." });
    }
});

// API: Xóa Journey và tất cả các Gate liên quan
router.post("/delete/:id", async (req, res) => {
    const journeyId = req.params.id;

    try {
        await gateService.deleteGatesByJourney(journeyId);
        await journeyService.deleteJourney(journeyId);

        res.status(200).json({ message: "Journey and related Gates deleted successfully!" });
    } catch (err) {
        console.error("Error deleting journey:", err);
        res.status(500).json({ error: "Failed to delete Journey and related Gates." });
    }
});

module.exports = router;
