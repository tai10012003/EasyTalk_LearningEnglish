const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { JourneyService, GateService, StageService, UserprogressService } = require("../services");
const journeyService = new JourneyService();
const gateService = new GateService();
const stageService = new StageService();
const userprogressService = new UserprogressService();

router.get("/stage/api/stage/detail/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stageId = req.params.id;
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            userProgress = await userprogressService.createUserProgress(userId);
        }
        const stage = await stageService.getStageById(stageId);
        if (!stage) {
            return res.status(404).json({ error: "Chặng không tồn tại." });
        }
        res.json({ stage, userProgress });
    } catch (err) {
        res.status(500).json({ error: "Đã xảy ra lỗi khi tải chi tiết chặng." });
    }
});

router.post("/stage/api/stage/complete/:id", verifyToken, async (req, res) => {
    try {
        const stageId = req.params.id;
        const userId = req.user.id;
        const currentStage = await stageService.getStageById(stageId);
        if (!currentStage) {
            return res.status(404).json({ error: "Không tìm thấy chặng." });
        }
        const gateId = currentStage.gate;
        const gate = await gateService.getGateById(gateId);
        if (!gate) {
            return res.status(404).json({ error: "Không thể tìm thấy cổng cho chặng hiện tại." });
        }
        const currentJourneyId = gate.journey;
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const journey = await journeyService.getJourney(currentJourneyId);
            userProgress = await userprogressService.createUserProgress(userId, journey);
        }
        if (!userProgress.unlockedStages.some(stage => stage.toString() == stageId)) {
            userProgress.unlockedStages.push(new ObjectId(stageId));
        }
        const allStagesInGate = await stageService.getStagesInGate(currentStage.gate);
        const currentStageIndex = allStagesInGate.findIndex(stage => stage._id.toString() == stageId);
        if (currentStageIndex !== -1 && currentStageIndex < allStagesInGate.length - 1) {
            const nextStage = allStagesInGate[currentStageIndex + 1];
            if (!userProgress.unlockedStages.some(stage => stage.toString() == nextStage._id.toString())) {
                userProgress.unlockedStages.push(nextStage._id);
            }
        } else {
            const allGatesInJourney = await gateService.getGatesInJourney(currentJourneyId);
            const currentGateIndex = allGatesInJourney.findIndex(gate => gate._id.toString() == currentStage.gate.toString());
            if (currentGateIndex !== -1 && currentGateIndex < allGatesInJourney.length - 1) {
                const nextGate = allGatesInJourney[currentGateIndex + 1];
                if (!userProgress.unlockedGates.some(gate => gate.toString() == nextGate._id.toString())) {
                    userProgress.unlockedGates.push(nextGate._id);
                    const firstStageOfNextGate = await stageService.getStagesInGate(nextGate._id);
                    if (firstStageOfNextGate.length > 0 && !userProgress.unlockedStages.some(stage => stage.toString() == firstStageOfNextGate[0]._id.toString())) {
                        userProgress.unlockedStages.push(firstStageOfNextGate[0]._id);
                    }
                }
            }
        }
        userProgress.experiencePoints += 10;
        await userprogressService.updateUserProgress(userProgress);
        res.json({ message: "Chặng đã hoàn thành và tiến trình đã được cập nhật." });
    } catch (error) {
        console.error("Error processing stage completion:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý tiến trình.", detail: error.message });
    }
});

module.exports = router;