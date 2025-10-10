const express = require("express");
const router = express.Router();
const StageService = require("../../services/stageService");
const GateService = require("../../services/gateService");
const { ObjectId } = require("mongodb");
const stageService = new StageService();
const gateService = new GateService();

router.get("/", async (req, res) => {
    try {
        const gateData = await gateService.getGateList();
        const gates = gateData.gates;
        res.render("stages/stage", { gates });
    } catch (error) {
        console.error("Error fetching gates:", error);
        res.status(500).send("Failed to load gates.");
    }
});

router.get("/api/stages", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

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

router.get("/add", async (req, res) => {
    try {
        const gateData = await gateService.getGateList();
        const gates = gateData.gates;
        res.render("stages/addstage", { gates });
    } catch (error) {
        console.error("Error loading gates:", error);
        res.status(500).send("Failed to load gates for stage creation.");
    }
});

router.post("/add", async (req, res) => {
    const { title, questions, gateId } = req.body;

    if (!title || !gateId) {
        return res.status(400).json({ error: "Tiêu đề và ID cổng là bắt buộc." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
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

    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Tiêu đề không để trống." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
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
