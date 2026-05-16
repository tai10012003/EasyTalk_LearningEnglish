const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const UserSettingService = require("../services/usersettingService");
const { validateUserSettingUpdate, validateSection } = require("../validators/usersettingValidator");

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
        const validation = validateUserSettingUpdate(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const userId = req.user.id;
        await userSettingService.updateUserSetting(userId, req.body);
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error) {
        console.error("Error updating user settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/api/usersettings/:section", verifyToken, async (req, res) => {
    try {
        const { section } = req.params;
        const sectionValidation = validateSection(section);
        if (!sectionValidation.valid) {
            return res.status(400).json({ success: false, message: sectionValidation.error });
        }
        const validation = validateUserSettingUpdate({ [section]: req.body });
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const userId = req.user.id;
        const data = req.body;
        await userSettingService.updateSection(userId, section, data);
        res.json({ message: `Cập nhật ${section} thành công` });
    } catch (error) {
        console.error("Error updating section:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;