const express = require("express");
const router = express.Router();
const JourneyService = require("../../services/journeyService");
const GateService = require("../../services/gateService");
const gateService = new GateService();
const journeyService = new JourneyService();

router.get("/", function (req, res) {
    res.render('journeys/journey');
});

router.get("/api/journey-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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

router.post("/add", async (req, res) => {
    const { title } = req.body;
    try {
        const newJourney = await journeyService.insertJourney({
            title: title,
            gates: [],
            createdAt: new Date()
        });

        res.status(200).json({ message: "Hành trình đã được thêm thành công !", journey: newJourney });
    } catch (err) {
        console.error("Error adding journey:", err);
        res.status(500).json({ error: "Failed to add Journey." });
    }
});

router.post("/update/:id", async (req, res) => {
    const journeyId = req.params.id;
    const updateData = { title: req.body.title };

    try {
        await journeyService.updateJourney({ _id: journeyId, ...updateData });
        res.status(200).json({ message: "Hành trình đã được cập nhật thành công !" });
    } catch (err) {
        console.error("Error updating journey:", err);
        res.status(500).json({ error: "Failed to update Journey." });
    }
});

router.post("/delete/:id", async (req, res) => {
    const journeyId = req.params.id;

    try {
        await gateService.deleteGatesByJourney(journeyId);
        await journeyService.deleteJourney(journeyId);

        res.status(200).json({ message: "Hành trình và các cổng liên quan đã xóa thành công !" });
    } catch (err) {
        console.error("Error deleting journey:", err);
        res.status(500).json({ error: "Failed to delete Journey and related Gates." });
    }
});

module.exports = router;
