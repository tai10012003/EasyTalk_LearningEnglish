const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { UserSettingService } = require("./../services");
const userSettingService = new UserSettingService();

router.get("/api/usersettings", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const settings = await userSettingService.getUserSettingByUserId(userId);
        res.json(settings);
    } catch (error) {
        console.error("Error fetching user settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/api/usersettings", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await userSettingService.updateUserSetting(userId, req.body);
        res.json({ message: "Cập nhật thành công" });
    } catch (error) {
        console.error("Error updating user settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/api/usersettings/:section", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { section } = req.params;
        const data = req.body;
        await userSettingService.updateSection(userId, section, data);
        res.json({ message: `Cập nhật ${section} thành công` });
    } catch (error) {
        console.error("Error updating section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;