const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const StageService = require("../services/stageService");
const { validateStageInput } = require("../validators/stageValidator");
const { handleStageCompletion } = require("../repositories/queries/stageCompletion");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const stageService = new StageService();

let journeyService = null;
let gateService = null;
let userProgressService = null;

function setJourneyService(service) {
    journeyService = service;
}

function setGateService(service) {
    gateService = service;
}

function setUserProgressService(service) {
    userProgressService = service;
}

router.get("/api/stage/detail/:id", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const stageId = req.params.id;
    let userProgress = await userProgressService.getUserProgressByUserId(userId);
    if(!userProgress) {
        userProgress = await userProgressService.createUserProgress(userId);
    }
    const stage = await stageService.getStageById(stageId);
    if(!stage) {
        return res.status(404).json({ error: "Chặng không tồn tại." });
    }
    res.json({ stage, userProgress });
}));

router.post("/api/stage/complete/:id", verifyToken, asyncHandler(async (req, res) => {
    const stageId = req.params.id;
    const userId = req.user.id;
    const currentStage = await stageService.getStageById(stageId);
    if(!currentStage) {
        return res.status(404).json({ error: "Không tìm thấy chặng." });
    }
    const gateId = currentStage.gate;
    const gate = await gateService.getGateById(gateId);
    if(!gate) {
        return res.status(404).json({ error: "Không thể tìm thấy cổng cho chặng hiện tại." });
    }
    const currentJourneyId = gate.journey;
    let userProgress = await userProgressService.getUserProgressByUserId(userId);
    if(!userProgress) {
        const journey = await journeyService.getJourney(currentJourneyId);
        userProgress = await userProgressService.createUserProgress(userId, journey);
    }
    userProgress = await handleStageCompletion(stageId, currentStage, userProgress, stageService, gateService, journeyService);
    await userProgressService.updateUserProgress(userProgress);
    res.json({ message: "Chặng đã hoàn thành và tiến trình đã được cập nhật." });
}));

router.get("/api/stages", asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const { stages, totalStages } = await stageService.getStageList(page, limit);
    const totalPages = Math.ceil(totalStages / limit);
    res.json({
        success: true,
        data: stages,
        currentPage: page,
        totalPages,
    });
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateStageInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const { title, questions, gateId } = req.body;
    const newStage = await stageService.insertStage({
        title,
        questions,
        gate: new ObjectId(gateId),
        createdAt: new Date(),
    });
    await gateService.addStageToGate(gateId, newStage.insertedId);
    res.json({ 
        success: true, 
        message: "Chặng đã được thêm thành công !", 
        stage: newStage 
    });
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
    const stage = await stageService.getStageById(req.params.id);
    const gateData = await gateService.getGateList();
    const gates = gateData.gates;
    res.json({ stage, gates });
}));

router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const validation = validateStageInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const stageId = req.params.id;
    const { title, questions, gateId: newGateId } = req.body;
    const currentStage = await stageService.getStageById(stageId);
    if(!currentStage) {
        return res.status(404).json({ error: "Chặng không tìm thấy." });
    }
    const oldGateId = currentStage.gate ? currentStage.gate.toString() : null;
    await stageService.updateStage(stageId, { 
        title, 
        questions, 
        gate: new ObjectId(newGateId) 
    });
    if(oldGateId && oldGateId !== newGateId) {
        await gateService.removeStageFromGate(oldGateId, stageId);
        await gateService.addStageToGate(newGateId, stageId);
    }
    res.json({ 
        success: true, 
        message: "Chặng đã được cập nhật thành công !" 
    });
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
    const stageId = req.params.id;
    const currentStage = await stageService.getStageById(stageId);
    if(!currentStage) {
        return res.status(404).json({ error: "Chặng không tìm thấy." });
    }
    await stageService.deleteStage(stageId);
    await gateService.removeStageFromGate(currentStage.gate, stageId);
    res.json({ 
        success: true, 
        message: "Chặng đã xóa thành công !" 
    });
}));

module.exports = router;
module.exports.setJourneyService = setJourneyService;
module.exports.setGateService = setGateService;
module.exports.setUserProgressService = setUserProgressService;