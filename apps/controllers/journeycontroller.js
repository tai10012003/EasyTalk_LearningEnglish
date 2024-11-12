// journeycontroller.js
const express = require("express");
const router = express.Router();
const JourneyService = require("../services/journeyService");
const verifyToken = require("./../util/VerifyToken");
const UserProgressService = require("../services/userprogressService");
const userProgressService = new UserProgressService();
const journeyService = new JourneyService();

router.get('/', (req, res) => {
    res.render('journeys/journey-list');
});
router.get("/api", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const journeys = await journeyService.getAllJourneysWithDetails();

        const userProgress = await userProgressService.getUserProgressByUserId(userId) || { unlockedGates: [], unlockedStages: [] };
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

        const leaderboard = await userProgressService.getLeaderboard(10);

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

router.get('/detail/:id', (req, res) => {
    res.render('gates/gate-list');
});

router.get("/api/:id", verifyToken, async (req, res) => {
    try {
        const journeyId = req.params.id;
        const userId = req.user.id;
        const journey = await journeyService.getJourneyWithDetails(journeyId);

        if (!journey) {
            return res.status(404).json({ error: "Journey not found." });
        }
        let userProgress = await userProgressService.getUserProgressByUserId(userId);

        if (!userProgress) {
            userProgress = await userProgressService.createUserProgress(userId, journey);
        } else {
            userProgress = await userProgressService.unlockJourneyInitial(userProgress, journey);
        }
        const unlockedGates = userProgress.unlockedGates || [];
        const unlockedStages = userProgress.unlockedStages || [];
        const completedGates = unlockedGates.length;
        const completedStages = unlockedStages.length;

        const leaderboard = await userProgressService.getLeaderboard(10);
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

module.exports = router;
