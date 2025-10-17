const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const verifyToken = require("./../util/VerifyToken");
const { JourneyService, GateService, StageService, UserprogressService } = require("../services");
const journeyService = new JourneyService();
const gateService = new GateService();
const stageService = new StageService();
const userprogressService = new UserprogressService();

router.get("/api/stage/detail/:id", verifyToken, async (req, res) => {
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

router.post("/api/stage/complete/:id", verifyToken, async (req, res) => {
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

router.get("/api/stages", async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error fetching stages:", error);
        res.status(500).json({ success: false, message: "Error fetching stages", error: error.message });
    }
});

router.post("/add", async (req, res) => {
    const { title, questions, gateId } = req.body;
    if (!title || !gateId) {
        return res.status(400).json({ error: "Tiêu đề và ID cổng là bắt buộc." });
    }
    if (!Array.isArray(questions) || questions.length == 0) {
        return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ." });
    }
    try {
        const newStage = await stageService.insertStage({
            title,
            questions,
            gate: new ObjectId(gateId),
            createdAt: new Date(),
        });
        await gateService.addStageToGate(gateId, newStage.insertedId);
        res.json({ success: true, message: "Chặng đã được thêm thành công !", stage: newStage });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding stage", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const stage = await stageService.getStageById(req.params.id);
        const gateData = await gateService.getGateList();
        const gates = gateData.gates;
        res.json({ stage, gates });
    } catch (err) {
        console.error("Error fetching stage exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    const stageId = req.params.id;
    const { title, questions, gateId: newGateId } = req.body;
    if (!title || title.trim() == "") {
        return res.status(400).json({ success: false, message: "Tiêu đề không để trống." });
    }
    if (!Array.isArray(questions) || questions.length == 0) {
        return res.status(400).json({ success: false, message: "Câu hỏi không hợp lệ." });
    }
    try {
        const currentStage = await stageService.getStageById(stageId);
        if (!currentStage) {
            return res.status(404).json({ error: "Chặng không tìm thấy." });
        }
        const oldGateId = currentStage.gate ? currentStage.gate.toString() : null;
        await stageService.updateStage(stageId, { title, questions, gate: new ObjectId(newGateId) });
        if (oldGateId && oldGateId !== newGateId) {
            await gateService.removeStageFromGate(oldGateId, stageId);
            await gateService.addStageToGate(newGateId, stageId);
        }
        res.json({ success: true, message: "Chặng đã được cập nhật thành công !" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating stage", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    const stageId = req.params.id;
    try {
        const currentStage = await stageService.getStageById(stageId);
        if (!currentStage) {
            return res.status(404).json({ error: "Chặng không tìm thấy." });
        }
        await stageService.deleteStage(stageId);
        await gateService.removeStageFromGate(currentStage.gate, stageId);
        res.json({ success: true, message: "Chặng đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting stage", error: err.message });
    }
});

module.exports = router;