const express = require("express");
const router = express.Router();
const { ObjectId } = require('mongodb');
const { JourneyService, GateService, StageService } = require("../services");
const journeyService = new JourneyService();
const gateService = new GateService();
const stageService = new StageService();

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

router.put("/update/:id", async (req, res) => {
    const gateId = req.params.id;
    const { title, journeyId: newJourneyId } = req.body;
    try {
        const currentGate = await gateService.getGateById(gateId);

        if (!currentGate) {
            return res.status(404).json({ error: "Cổng không tìm thấy." });
        }
        const oldJourneyId = currentGate.journey ? currentGate.journey.toString() : null;
        const updateGate = await gateService.updateGate({
            _id: gateId,
            title,
            journey: new ObjectId(newJourneyId)
        });
        if (oldJourneyId && oldJourneyId !== newJourneyId) {
            await journeyService.removeGateFromJourney(oldJourneyId, gateId);
            await journeyService.addGateToJourney(newJourneyId, gateId);
        }
        res.status(200).json({ message: "Cổng đã được cập nhật thành công !", gate: updateGate });
    } catch (err) {
        console.error("Error updating gate:", err);
        res.status(500).json({ error: "Failed to update Gate." });
    }
});

router.delete("/delete/:id", async (req, res) => {
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