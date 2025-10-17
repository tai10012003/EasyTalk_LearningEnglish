const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { JourneyService, GateService, UserprogressService } = require("../services");
const journeyService = new JourneyService();
const gateService = new GateService();
const userprogressService = new UserprogressService();

router.get("/api", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const journeys = await journeyService.getAllJourneysWithDetails();
        const userProgress = await userprogressService.getUserProgressByUserId(userId) || { unlockedGates: [], unlockedStages: [] };
        const userCompletedGates = userProgress.unlockedGates.map(id => id.toString());
        const userCompletedStages = userProgress.unlockedStages.map(id => id.toString());
        journeys.forEach(journey => {
            let totalGates = 0;
            let totalStages = 0;
            let completedJourneyGates = 0;
            let completedJourneyStages = 0;
            if (Array.isArray(journey.gates)) {
                journey.gates.forEach(gate => {
                    totalGates++;
                    if (userCompletedGates.includes(gate._id?.toString())) {
                        completedJourneyGates++;
                    }
                    if (Array.isArray(gate.stages)) {
                        totalStages += gate.stages.length;
                        gate.stages.forEach(stage => {
                            if (userCompletedStages.includes(stage._id?.toString())) {
                                completedJourneyStages++;
                            }
                        });
                    }
                });
            }
            const totalItems = totalGates + totalStages;
            const completedItems = completedJourneyGates + completedJourneyStages;
            journey.progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        });
        const totalGates = journeys.reduce((sum, journey) => sum + (Array.isArray(journey.gates) ? journey.gates.length : 0), 0);
        const totalStages = journeys.reduce((sum, journey) => sum + journey.gates.reduce((gSum, gate) => gSum + (Array.isArray(gate.stages) ? gate.stages.length : 0), 0), 0);
        const totalCompletedGates = userCompletedGates.length;
        const totalCompletedStages = userCompletedStages.length;
        const totalItems = totalGates + totalStages;
        const completedItems = totalCompletedGates + totalCompletedStages;
        const overallProgressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        const leaderboard = await userprogressService.getLeaderboard(10);
        res.json({
            journeys,
            userProgress,
            totalStages,
            totalGates,
            completedGates: totalCompletedGates,
            completedStages: totalCompletedStages,
            progressPercentage: overallProgressPercentage.toFixed(2),
            leaderboard
        });
    } catch (err) {
        console.error("Lỗi khi tải danh sách hành trình:", err);
        res.status(500).json({ error: "Đã xảy ra lỗi khi tải danh sách hành trình." });
    }
});

router.get("/api/gate/:id", verifyToken, async (req, res) => {
    try {
        const journeyId = req.params.id;
        const userId = req.user.id;
        const journey = await journeyService.getJourneyWithDetails(journeyId);
        if (!journey) {
            return res.status(404).json({ error: "Journey not found." });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            userProgress = await userprogressService.createUserProgress(userId, journey);
        } else {
            userProgress = await userprogressService.unlockJourneyInitial(userProgress, journey);
        }
        const unlockedGates = userProgress.unlockedGates || [];
        const unlockedStages = userProgress.unlockedStages || [];
        const completedGates = unlockedGates.length;
        const completedStages = unlockedStages.length;
        const leaderboard = await userprogressService.getLeaderboard(10);
        res.json({
            journey,
            userProgress,
            completedGates,
            completedStages,
            leaderboard
        });
    } catch (err) {
        console.error("Error loading journey details:", err);
        res.status(500).json({ error: "An error occurred while loading journey details." });
    }
});

router.get("/api/journey-list", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
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

router.put("/update/:id", async (req, res) => {
    const journeyId = req.params.id;
    const updateData = { title: req.body.title };
    try {
        const updatedJourney = await journeyService.updateJourney({ _id: journeyId, ...updateData });
        res.status(200).json({ message: "Hành trình đã được cập nhật thành công!", journey: updatedJourney });
    } catch (err) {
        console.error("Error updating journey:", err);
        res.status(500).json({ error: "Failed to update Journey." });
    }
});

router.delete("/delete/:id", async (req, res) => {
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