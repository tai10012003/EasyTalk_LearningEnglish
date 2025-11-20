const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { PrizeService, UserprogressService } = require("./../services");
const prizeService = new PrizeService();
const userprogressService = new UserprogressService();

router.get("/api/prizes", verifyToken, async (req, res) => {
    try {
        const prizes = await prizeService.getAllPrizes();
        res.json({ success: true, prizes });
    } catch (error) {
        console.error("Error fetching prizes:", error);
        res.status(500).json({ success: false, message: "Error fetching prizes" });
    }
});

router.get("/api/prize-list", verifyToken, async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error fetching prizes:", error);
        res.status(500).json({ success: false, message: "Error fetching prizes", error: error.message });
    }
});

router.get("/api/type/:type", verifyToken, async (req, res) => {
    try {
        const { type } = req.params;
        const prizes = await prizeService.getPrizesByType(type);
        res.json({ success: true, prizes });
    } catch (error) {
        console.error("Error fetching prizes by type:", error);
        res.status(500).json({ success: false, message: "Error fetching prizes" });
    }
});

router.post("/check-prize", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const nonChampionResult = await userprogressService.checkAndUnlockNonChampionPrizes(userId);
        const championResult = await userprogressService.manuallyCheckChampionPrizes(userId);
        const newPrizes = [...nonChampionResult.newPrizes, ...championResult.newPrizes];
        res.json({
            success: true,
            newPrizes,
            totalUnlocked: newPrizes.length,
            message: newPrizes.length > 0 ? "Chúc mừng! Bạn đã mở khóa giải thưởng mới!" : "Không có giải mới."
        });
    } catch (error) {
        console.error("Error checking prizes:", error);
        res.status(500).json({ success: false, message: "Lỗi kiểm tra giải thưởng" });
    }
});

router.post("/check-all-prizes", verifyToken, async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Chỉ admin được phép" });
    }
    try {
        const results = await userprogressService.manuallyCheckChampionPrizesForAll();
        res.json({ success: true, updatedUsers: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/add", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const result = await prizeService.createPrize(req.body);
        res.json({ success: true, prizeId: result.insertedId });
    } catch (error) {
        console.error("Error creating prize:", error);
        res.status(500).json({ success: false, message: "Error creating prize" });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const prize = await prizeService.getPrizeById(req.params.id);
        if (!prize) {
            return res.status(404).json({ message: "Prize not found" });
        }
        res.json(prize);
    } catch (err) {
        console.error("Error fetching prize:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const result = await prizeService.updatePrize(req.params.id, req.body);
        res.json({ success: true, result });
    } catch (error) {
        console.error("Error updating prize:", error);
        res.status(500).json({ success: false, message: "Error updating prize" });
    }
});

router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        const result = await prizeService.deletePrize(req.params.id);
        res.json({ success: true, result });
    } catch (error) {
        console.error("Error deleting prize:", error);
        res.status(500).json({ success: false, message: "Error deleting prize" });
    }
});

module.exports = router;