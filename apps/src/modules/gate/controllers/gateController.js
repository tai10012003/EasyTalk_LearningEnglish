const express = require("express");
const { verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { validateGateInput } = require("../validators/gateValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createGateController({ gateService }) {
    if (!gateService) {
        throw new Error("createGateController requires gateService");
    }
    const router = express.Router();
    router.get("/api/gate-list", asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { gates, totalGates } = await gateService.getGateList(page, limit, { lang });
        const totalPages = Math.ceil(totalGates / limit);
        res.json({
            gates,
            currentPage: page,
            totalPages,
            totalGates
        });
    }));
    router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateGateInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }
        const { title, journeyId } = req.body;
        const newGate = await gateService.createGate({ title, journeyId });
        res.status(200).json({
            message: "Cổng đã được thêm thành công !",
            gate: newGate
        });
    }));
    router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const validation = validateGateInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }
        const gateId = req.params.id;
        const { title, journeyId: newJourneyId } = req.body;
        const updateGate = await gateService.updateGateAndJourneyLink(gateId, {
            title,
            journeyId: newJourneyId
        });
        if(!updateGate) {
            return res.status(404).json({ error: "Cổng không tìm thấy." });
        }
        res.status(200).json({
            message: "Cổng đã được cập nhật thành công !",
            gate: updateGate
        });
    }));
    router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const gateId = req.params.id;
        const result = await gateService.deleteGateWithStages(gateId);
        if(!result) {
            return res.status(404).json({ error: "Cổng không tìm thấy." });
        }
        res.status(200).json({ message: "Cổng đã xóa thành công !" });
    }));
    return router;
}

module.exports = { createGateController };
