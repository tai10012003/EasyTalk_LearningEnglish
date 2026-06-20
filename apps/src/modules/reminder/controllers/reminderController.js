const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const ReminderService = require("../services/reminderService");
const { validateReminderInput } = require("../validators/reminderValidator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const reminderService = new ReminderService();
let notificationService = null;

function setNotificationService(service) {
    notificationService = service;
    reminderService.setNotificationService(service);
}

router.get("/api/reminder-list", verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await reminderService.getReminders(userId, page, limit);
        res.json(result);
}));

router.get("/api/reminder/:id", verifyToken, asyncHandler(async (req, res) => {
        const reminder = await reminderService.getReminderById(req.params.id);
        if(!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }
        res.json(reminder);
}));

router.post("/api/add", verifyToken, asyncHandler(async (req, res) => {
        const validation = validateReminderInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const userId = req.user.id;
        const { email, reminderTime, frequency, additionalInfo } = req.body;
        const reminderId = await reminderService.createReminder(userId, email, reminderTime, frequency, additionalInfo);
        res.status(201).json({ message: "Nhắc nhở học tập đã được thêm thành công !", reminderId });
}));

router.put("/api/update/:id", verifyToken, asyncHandler(async (req, res) => {
        const validation = validateReminderInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { id } = req.params;
        const updatedFields = req.body;
        await reminderService.updateReminder(id, updatedFields);
        res.status(200).json({ message: "Nhắc nhở học tập đã được cập nhật thành công !" });
}));

router.delete("/api/delete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { id } = req.params;
        await reminderService.deleteReminder(id);
        res.status(200).json({ message: "Nhắc nhở học tập đã xóa thành công !" });
}));

router.get("/api/stats", verifyToken, asyncHandler(async (req, res) => {
        const activeJobs = reminderService.getActiveJobsCount();
        res.json({ activeJobs, message: `Currently ${activeJobs} reminder job(s) are scheduled.` });
}));

module.exports = router;
module.exports.setNotificationService = setNotificationService;
module.exports.reminderService = reminderService;