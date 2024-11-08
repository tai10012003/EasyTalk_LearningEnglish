const express = require("express");
const router = express.Router();
const GateService = require("../../services/gateService");
const JourneyService = require("../../services/journeyService");
const { ObjectId } = require('mongodb');
const gateService = new GateService();
const journeyService = new JourneyService();
const StageService = require("../../services/stageService"); // Sử dụng StageService
const stageService = new StageService(); // Khởi tạo StageService

// Render the Gate page with journeys for the dropdown
router.get("/", async (req, res) => {
    try {
        const journeyData = await journeyService.getJourneyList(); // Fetch paginated journey data
        const journeys = journeyData.journeys; // Extract the journeys array
        res.render('gates/gate', { journeys }); // Pass the journeys array to the template
    } catch (error) {
        console.error("Error fetching journeys:", error);
        res.status(500).send("Failed to load journeys.");
    }
});


// API: Get a paginated list of Gates
router.get("/api/gate-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Items per page
        const { gates, totalGates } = await gateService.getGateList(page, limit);
        const totalPages = Math.ceil(totalGates / limit);

        res.json({
            gates,
            currentPage: page,
            totalPages,
            totalGates
        });
    } catch (err) {
        console.error("Error retrieving gates:", err);
        res.status(500).json({ error: "Failed to retrieve gates." });
    }
});

// API: Thêm Gate mới và cập nhật Journey
router.post("/add", async (req, res) => {
    const { title, journeyId } = req.body;

    if (!title || !journeyId) {
        return res.status(400).json({ error: "Title and Journey ID are required" });
    }

    try {
        // Thêm Gate mới
        const newGate = await gateService.insertGate({
            title,
            journey: new ObjectId(journeyId),
            stages: [],
            createdAt: new Date()
        });

        // Cập nhật Journey: thêm Gate ID vào danh sách gates của Journey
        await journeyService.addGateToJourney(journeyId, newGate.insertedId);

        res.status(200).json({ message: "Gate added successfully!", gate: newGate });
    } catch (err) {
        console.error("Error adding gate:", err);
        res.status(500).json({ error: "Failed to add Gate." });
    }
});

// API: Update a Gate và cập nhật Journey
router.post("/update/:id", async (req, res) => {
    const gateId = req.params.id;
    const { title, journeyId: newJourneyId } = req.body;

    try {
        // Lấy thông tin hiện tại của Gate để kiểm tra Journey ban đầu
        const currentGate = await gateService.getGateById(gateId);

        if (!currentGate) {
            return res.status(404).json({ error: "Gate not found." });
        }

        const oldJourneyId = currentGate.journey ? currentGate.journey.toString() : null;

        // Cập nhật Gate
        await gateService.updateGate({
            _id: gateId,
            title,
            journey: new ObjectId(newJourneyId)
        });

        // Kiểm tra nếu Journey thay đổi, cập nhật danh sách gates trong các Journey tương ứng
        if (oldJourneyId && oldJourneyId !== newJourneyId) {
            await journeyService.removeGateFromJourney(oldJourneyId, gateId);
            await journeyService.addGateToJourney(newJourneyId, gateId);
        }

        res.status(200).json({ message: "Gate updated successfully!" });
    } catch (err) {
        console.error("Error updating gate:", err);
        res.status(500).json({ error: "Failed to update Gate." });
    }
});

// API: Delete a Gate và cập nhật Journey
router.post("/delete/:id", async (req, res) => {
    const gateId = req.params.id;

    try {
        const currentGate = await gateService.getGateById(gateId);

        if (!currentGate) {
            return res.status(404).json({ error: "Gate not found." });
        }

        await stageService.deleteStageByGate(gateId);
        await gateService.deleteGate(gateId);

        // Xóa Gate ID khỏi danh sách gates của Journey tương ứng
        await journeyService.removeGateFromJourney(currentGate.journey, gateId);

        res.status(200).json({ message: "Gate deleted successfully!" });
    } catch (err) {
        console.error("Error deleting gate:", err);
        res.status(500).json({ error: "Failed to delete Gate." });
    }
});

module.exports = router;
