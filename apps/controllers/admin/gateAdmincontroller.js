const express = require("express");
const router = express.Router();
const GateService = require("../../services/gateService");
const JourneyService = require("../../services/journeyService");
const { ObjectId } = require('mongodb');
const gateService = new GateService();
const journeyService = new JourneyService();
const StageService = require("../../services/stageService");
const stageService = new StageService();

router.get("/", async (req, res) => {
    try {
        const journeyData = await journeyService.getJourneyList();
        const journeys = journeyData.journeys;
        res.render('gates/gate', { journeys });
    } catch (error) {
        console.error("Error fetching journeys:", error);
        res.status(500).send("Failed to load journeys.");
    }
});

router.get("/api/gate-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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

router.post("/add", async (req, res) => {
    const { title, journeyId } = req.body;
    try {
        const newGate = await gateService.insertGate({
            title,
            journey: new ObjectId(journeyId),
            stages: [],
            createdAt: new Date()
        });
        await journeyService.addGateToJourney(journeyId, newGate.insertedId);

        res.status(200).json({ message: "Cổng đã được thêm thành công !", gate: newGate });
    } catch (err) {
        console.error("Error adding gate:", err);
        res.status(500).json({ error: "Failed to add Gate." });
    }
});

router.post("/update/:id", async (req, res) => {
    const gateId = req.params.id;
    const { title, journeyId: newJourneyId } = req.body;

    try {
        const currentGate = await gateService.getGateById(gateId);

        if (!currentGate) {
            return res.status(404).json({ error: "Cổng không tìm thấy." });
        }

        const oldJourneyId = currentGate.journey ? currentGate.journey.toString() : null;
        await gateService.updateGate({
            _id: gateId,
            title,
            journey: new ObjectId(newJourneyId)
        });
        if (oldJourneyId && oldJourneyId !== newJourneyId) {
            await journeyService.removeGateFromJourney(oldJourneyId, gateId);
            await journeyService.addGateToJourney(newJourneyId, gateId);
        }

        res.status(200).json({ message: "Cổng đã được cập nhật thành công !" });
    } catch (err) {
        console.error("Error updating gate:", err);
        res.status(500).json({ error: "Failed to update Gate." });
    }
});

router.post("/delete/:id", async (req, res) => {
    const gateId = req.params.id;

    try {
        const currentGate = await gateService.getGateById(gateId);

        if (!currentGate) {
            return res.status(404).json({ error: "Cổng không tìm thấy." });
        }

        await stageService.deleteStageByGate(gateId);
        await gateService.deleteGate(gateId);
        await journeyService.removeGateFromJourney(currentGate.journey, gateId);

        res.status(200).json({ message: "Cổng đã xóa thành công !" });
    } catch (err) {
        console.error("Error deleting gate:", err);
        res.status(500).json({ error: "Failed to delete Gate." });
    }
});

module.exports = router;
