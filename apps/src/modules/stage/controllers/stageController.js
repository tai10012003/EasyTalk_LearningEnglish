const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validateStageInput } = require("../validators/stageValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createStageController({ stageService }) {
    if (!stageService) {
        throw new Error("createStageController requires stageService");
    }
    const router = express.Router();

    router.get("/api/stage/detail/:id", verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const stageId = req.params.id;
        const { stage, userProgress } = await stageService.getStageDetailForUser(stageId, userId);
        if(!stage) {
            return res.status(404).json({ error: "Chặng không tồn tại." });
        }
        res.json({ stage, userProgress });
    }));
    router.post("/api/stage/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const stageId = req.params.id;
        const userId = req.user.id;
        const result = await stageService.completeStageForUser(stageId, userId);
        if(result.status === "stage_not_found") {
            return res.status(404).json({ error: "Không tìm thấy chặng." });
        }
        if(result.status === "gate_not_found") {
            return res.status(404).json({ error: "Không thể tìm thấy cổng cho chặng hiện tại." });
        }
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
        const newStage = await stageService.createStage({
            title,
            questions,
            gateId
        });
        res.json({
            success: true,
            message: "Chặng đã được thêm thành công !",
            stage: newStage
        });
    }));
    router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const stage = await stageService.getStageById(req.params.id);
        const gateData = await stageService.getGateOptions();
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
        const updated = await stageService.updateStageAndGateLink(stageId, {
            title,
            questions,
            gateId: newGateId
        });
        if(!updated) {
            return res.status(404).json({ error: "Chặng không tìm thấy." });
        }
        res.json({
            success: true,
            message: "Chặng đã được cập nhật thành công !"
        });
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const stageId = req.params.id;
        const result = await stageService.deleteStageAndGateLink(stageId);
        if(!result) {
            return res.status(404).json({ error: "Chặng không tìm thấy." });
        }
        res.json({
            success: true,
            message: "Chặng đã xóa thành công !"
        });
    }));
    return router;
}

module.exports = { createStageController };
