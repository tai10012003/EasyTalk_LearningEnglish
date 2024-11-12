const express = require("express");
const router = express.Router();
const reminderService = require("../services/reminderService");
const verifyToken = require("./../util/VerifyToken");

router.get("/", (req, res) => {
    res.render("reminders/reminder");
});

router.get("/api/reminder-list", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const reminders = await reminderService.getRemindersByUserId(userId);
        res.json({ reminders });
    } catch (error) {
        console.error("Error in fetching reminders:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi lấy danh sách nhắc nhở", error: error.message });
    }
});

router.get("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const reminder = await reminderService.getReminderById(req.params.id);
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }
        res.json(reminder);
    } catch (error) {
        console.error("Error fetching reminder by ID:", error);
        res.status(500).json({ message: "Failed to fetch reminder", error: error.message });
    }
});

router.post("/api/reminder", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, reminderTime, frequency,additionalInfo } = req.body;
        const reminderId = await reminderService.createReminder(userId, email, reminderTime, frequency,additionalInfo);
        res.status(201).json({ message: "Nhắc nhở học tập đã được thêm thành công !", reminderId });
    } catch (error) {
        console.error("Error in creating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi tạo nhắc nhở", error: error.message });
    }
});

router.put("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedFields = req.body;
        await reminderService.updateReminder(id, updatedFields);
        res.status(200).json({ message: "Nhắc nhở học tập đã được cập nhật thành công !" });
    } catch (error) {
        console.error("Error in updating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật nhắc nhở", error: error.message });
    }
});

router.delete("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await reminderService.deleteReminder(id);
        res.status(200).json({ message: "Nhắc nhở học tập đã xóa thành công !" });
    } catch (error) {
        console.error("Error in deleting reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi xóa nhắc nhở", error: error.message });
    }
});

module.exports = router;
