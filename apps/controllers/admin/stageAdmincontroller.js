const express = require("express");
const router = express.Router();
const StageService = require("../../services/stageService"); // Sử dụng StageService
const GateService = require("../../services/gateService");
const { ObjectId } = require("mongodb");
const stageService = new StageService(); // Khởi tạo StageService
const gateService = new GateService();

// Render trang danh sách Stage với danh sách Gates
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

// API để lấy danh sách stage với phân trang
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

// Route để hiển thị trang thêm Stage mới
router.get("/add", async (req, res) => {
    try {
        const gateData = await gateService.getGateList();
        const gates = gateData.gates;
        res.render("stages/addstage", { gates }); // Render trang thêm stage mới với danh sách gates
    } catch (error) {
        console.error("Error loading gates:", error);
        res.status(500).send("Failed to load gates for stage creation.");
    }
});

// API để thêm một Stage mới và cập nhật Gate liên kết
router.post("/add", async (req, res) => {
    const { title, questions, gateId } = req.body;

    if (!title || !gateId) {
        return res.status(400).json({ error: "Title and Gate ID are required" });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        // Thêm `stage` mới với liên kết `gateId`
        const newStage = await stageService.insertStage({
            title,
            questions,
            gate: new ObjectId(gateId),  // Liên kết với gate
            createdAt: new Date(),
        });

        // Thêm `stageId` vào `stages` của `gate`
        await gateService.addStageToGate(gateId, newStage.insertedId);

        res.json({ success: true, message: "Stage added successfully!", stage: newStage });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding stage", error: err.message });
    }
});



// Route để hiển thị trang cập nhật một Stage
router.get("/update/:id", async (req, res) => {
    try {
        const stage = await stageService.getStageById(req.params.id);
        const gateData = await gateService.getGateList();
        const gates = gateData.gates;
        res.render("stages/updatestage", { stage, gates });
    } catch (err) {
        res.status(500).send("Error retrieving stage");
    }
});

// API để cập nhật một Stage và xử lý thay đổi Gate liên kết
router.post("/update/:id", async (req, res) => {
    const stageId = req.params.id;
    const { title, questions, gateId: newGateId } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ success: false, message: "Title cannot be empty." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Questions are invalid." });
    }

    try {
        const currentStage = await stageService.getStageById(stageId);
        if (!currentStage) {
            return res.status(404).json({ error: "Stage not found." });
        }
        
        const oldGateId = currentStage.gate ? currentStage.gate.toString() : null;
        await stageService.updateStage(stageId, { title, questions, gate: new ObjectId(newGateId) });

        // Nếu `gateId` thay đổi, cập nhật `stages` trong `gate` tương ứng
        if (oldGateId && oldGateId !== newGateId) {
            await gateService.removeStageFromGate(oldGateId, stageId);
            await gateService.addStageToGate(newGateId, stageId);
        }
        
        res.json({ success: true, message: "Stage updated successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating stage", error: err.message });
    }
});

// API để xóa một Stage và cập nhật Gate liên kết
router.delete("/delete/:id", async (req, res) => {
    const stageId = req.params.id;
    try {
        const currentStage = await stageService.getStageById(stageId);
        if (!currentStage) {
            return res.status(404).json({ error: "Stage not found." });
        }

        await stageService.deleteStage(stageId);
        await gateService.removeStageFromGate(currentStage.gate, stageId);

        res.json({ success: true, message: "Stage deleted successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting stage", error: err.message });
    }
});



module.exports = router;
