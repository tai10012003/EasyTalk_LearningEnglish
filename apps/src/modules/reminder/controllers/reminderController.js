const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const ReminderService = require("../services/reminderService");
const { validateReminderInput } = require("../validators/reminderValidator");

const reminderService = new ReminderService();
let notificationService = null;

function setNotificationService(service) {
    notificationService = service;
    reminderService.setNotificationService(service);
}

router.get("/api/reminder-list", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await reminderService.getReminders(userId, page, limit);
        res.json(result);
    } catch (err) {
        console.error("Get reminders error:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
});

router.get("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const reminder = await reminderService.getReminderById(req.params.id);
        if(!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }
        res.json(reminder);
    } catch (error) {
        console.error("Error fetching reminder by ID:", error);
        res.status(500).json({ message: "Failed to fetch reminder", error: error.message });
    }
});

router.post("/api/add", verifyToken, async (req, res) => {
    try {
        const validation = validateReminderInput(req.body);
        if(!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const userId = req.user.id;
        const { email, reminderTime, frequency, additionalInfo } = req.body;
        const reminderId = await reminderService.createReminder(userId, email, reminderTime, frequency, additionalInfo);
        res.status(201).json({ message: "Nhắc nhở học tập đã được thêm thành công !", reminderId });
    } catch (error) {
        console.error("Error in creating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi tạo nhắc nhở", error: error.message });
    }
});

router.put("/api/update/:id", verifyToken, async (req, res) => {
    try {
        const validation = validateReminderInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const { id } = req.params;
        const updatedFields = req.body;
        await reminderService.updateReminder(id, updatedFields);
        res.status(200).json({ message: "Nhắc nhở học tập đã được cập nhật thành công !" });
    } catch (error) {
        console.error("Error in updating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật nhắc nhở", error: error.message });
    }
});

router.delete("/api/delete/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await reminderService.deleteReminder(id);
        res.status(200).json({ message: "Nhắc nhở học tập đã xóa thành công !" });
    } catch (error) {
        console.error("Error in deleting reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi xóa nhắc nhở", error: error.message });
    }
});

router.get("/api/stats", verifyToken, async (req, res) => {
    try {
        const activeJobs = reminderService.getActiveJobsCount();
        res.json({ activeJobs, message: `Currently ${activeJobs} reminder job(s) are scheduled.` });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats", error: error.message });
    }
});

module.exports = router;
module.exports.setNotificationService = setNotificationService;
module.exports.reminderService = reminderService;