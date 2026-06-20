const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const UserSettingService = require("../services/usersettingService");
const { validateUserSettingUpdate, validateSection } = require("../validators/usersettingValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const userSettingService = new UserSettingService();

router.get("/api/usersettings", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const settings = await userSettingService.getUserSettingByUserId(userId);
    res.json(settings);
}));

router.put("/api/usersettings", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateUserSettingUpdate(req.body);
    if(!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }
    const userId = req.user.id;
    await userSettingService.updateUserSetting(userId, req.body);
    res.json({ success: true, message: "Cập nhật thành công" });
}));

router.put("/api/usersettings/:section", verifyToken, asyncHandler(async (req, res) => {
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
}));

module.exports = router;