const express = require("express");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

function createPrizeController({ prizeService, userPrizeService, englishTranslationService }) {
    if (!prizeService || !userPrizeService) {
        throw new Error("createPrizeController requires prizeService and userPrizeService");
    }
    if (englishTranslationService && typeof prizeService.setEnglishTranslationService === "function") {
        prizeService.setEnglishTranslationService(englishTranslationService);
    }
    const router = express.Router();
    router.get("/api/prizes", verifyToken, asyncHandler(async (req, res) => {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const prizes = await prizeService.getAllPrizes(lang);
        res.json({ success: true, prizes });
    }));
    router.get("/api/prize-list", verifyToken, asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { prizes, totalPrizes } = await prizeService.getPrizeList(page, limit, lang);
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
        const lang = req.query.lang === "en" ? "en" : "vi";
        const prizes = await prizeService.getPrizesByType(type, lang);
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
        const lang = req.query.lang === "en" ? "en" : "vi";
        const prize = await prizeService.getPrizeById(req.params.id, lang);
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
    return router;
}

module.exports = { createPrizeController };
