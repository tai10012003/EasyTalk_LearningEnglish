const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const PrizeService = require('../services/prizeService');
const UserPrizeService = require('../../userprogress/services/userprizeService');
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const prizeService = new PrizeService();
const userPrizeService = new UserPrizeService();

router.get("/api/prizes", verifyToken, asyncHandler(async (req, res) => {
        const prizes = await prizeService.getAllPrizes();
        res.json({ success: true, prizes });
}));

router.get("/api/prize-list", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const { prizes, totalPrizes } = await prizeService.getPrizeList(page, limit);
        const totalPages = Math.ceil(totalPrizes / limit);
        res.json({
            success: true,
            data: prizes,
            currentPage: page,
            totalPages,
        });
}));

router.get("/api/type/:type", verifyToken, asyncHandler(async (req, res) => {
        const { type } = req.params;
        const prizes = await prizeService.getPrizesByType(type);
        res.json({ success: true, prizes });
}));

router.post("/check-prize", verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const nonChampionResult = await userPrizeService.checkAndUnlockNonChampionPrizes(userId);
        const championResult = await userPrizeService.manuallyCheckChampionPrizes(userId);
        const newPrizes = [...nonChampionResult.newPrizes, ...championResult.newPrizes];
        res.json({
            success: true,
            newPrizes,
            totalUnlocked: newPrizes.length,
            message: newPrizes.length > 0 ? "Chúc mừng! Bạn đã mở khóa giải thưởng mới!" : "Không có giải mới."
        });
}));

router.post("/check-all-prizes", verifyAdmin, asyncHandler(async (req, res) => {
        const results = await userPrizeService.manuallyCheckChampionPrizesForAll();
        res.json({ success: true, updatedUsers: results });
}));

router.post("/add", verifyAdmin, asyncHandler(async (req, res) => {
        const result = await prizeService.createPrize(req.body);
        res.json({ success: true, prizeId: result.insertedId });
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const prize = await prizeService.getPrizeById(req.params.id);
        if (!prize) {
            return res.status(404).json({ message: "Prize not found" });
        }
        res.json(prize);
}));

router.put("/update/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const result = await prizeService.updatePrize(req.params.id, req.body);
        res.json({ success: true, result });
}));

router.delete("/delete/:id", verifyAdmin, asyncHandler(async (req, res) => {
        const result = await prizeService.deletePrize(req.params.id);
        res.json({ success: true, result });
}));

module.exports = router;