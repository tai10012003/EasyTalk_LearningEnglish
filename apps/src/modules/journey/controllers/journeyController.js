const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const JourneyService = require("../services/journeyService");
const { validateJourneyInput } = require("../validators/journeyValidator");
const { calculateJourneyProgress, calculateOverallProgress } = require("../utils/progressCalculator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

let journeyService = new JourneyService();

let gateService = null;
let userProgressService = null;

function setGateService(service) {
    gateService = service;
}

function setUserProgressService(service) {
    userProgressService = service;
}

router.get("/api", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const journeys = await journeyService.getAllJourneysWithDetails();
    const userProgress = await userProgressService.getUserProgressByUserId(userId) || { unlockedGates: [], unlockedStages: [] };
    const journeysWithProgress = calculateJourneyProgress(journeys, userProgress);
    const overallProgress = calculateOverallProgress(journeys, userProgress);
    const leaderboard = await userProgressService.getLeaderboard(10);
    res.json({
        journeys: journeysWithProgress,
        userProgress,
        totalStages: overallProgress.totalStages,
        totalGates: overallProgress.totalGates,
        completedGates: overallProgress.completedGates,
        completedStages: overallProgress.completedStages,
        progressPercentage: overallProgress.progressPercentage,
        leaderboard
    });
}));

router.get("/api/gate/:id", verifyToken, asyncHandler(async (req, res) => {
    const journeyId = req.params.id;
    const userId = req.user.id;
    const journey = await journeyService.getJourneyWithDetails(journeyId);
    if(!journey) {
        return res.status(404).json({ error: "Journey not found." });
    }
    let userProgress = await userProgressService.getUserProgressByUserId(userId);
    if(!userProgress) {
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
}));

router.get("/api/journey-list", asyncHandler(async (req, res) => {
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
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateJourneyInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const newJourney = await journeyService.insertJourney({
        title: req.body.title,
        gates: [],
        createdAt: new Date()
    });
    res.status(200).json({ 
        message: "Hành trình đã được thêm thành công !", 
        journey: newJourney 
    });
}));

router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateJourneyInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const journeyId = req.params.id;
    const updateData = { title: req.body.title };
    const updatedJourney = await journeyService.updateJourney({ _id: journeyId, ...updateData });
    res.status(200).json({ 
        message: "Hành trình đã được cập nhật thành công!", 
        journey: updatedJourney 
    });
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const journeyId = req.params.id;
    await gateService.deleteGatesByJourney(journeyId);
    await journeyService.deleteJourney(journeyId);
    res.status(200).json({ message: "Hành trình và các cổng liên quan đã xóa thành công !" });
}));

module.exports = router;
module.exports.setJourneyServiceInstance = (service) => {
    journeyService = service;
};
module.exports.setGateService = setGateService;
module.exports.setUserProgressService = setUserProgressService;