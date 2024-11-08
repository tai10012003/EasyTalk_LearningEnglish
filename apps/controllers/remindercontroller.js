const express = require("express");
const router = express.Router();
const reminderService = require("../services/reminderService");
const verifyToken = require("../util/verifyToken");

// Route để render giao diện danh sách reminders
router.get("/", (req, res) => {
    res.render("reminders/reminder");
});

// API GET để lấy danh sách reminders cho người dùng hiện tại
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
// API GET to fetch a single reminder by ID
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

// API POST để thêm reminder cho người dùng hiện tại
router.post("/api/reminder", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, reminderTime, frequency,additionalInfo } = req.body;
        const reminderId = await reminderService.createReminder(userId, email, reminderTime, frequency,additionalInfo);
        res.status(201).json({ message: "Reminder created successfully", reminderId });
    } catch (error) {
        console.error("Error in creating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi tạo nhắc nhở", error: error.message });
    }
});

// API PUT để cập nhật reminder
router.put("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedFields = req.body;
        await reminderService.updateReminder(id, updatedFields);
        res.status(200).json({ message: "Reminder updated successfully" });
    } catch (error) {
        console.error("Error in updating reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi cập nhật nhắc nhở", error: error.message });
    }
});

// API DELETE để xóa reminder
router.delete("/api/reminder/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await reminderService.deleteReminder(id);
        res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (error) {
        console.error("Error in deleting reminder:", error);
        res.status(500).json({ message: "Có lỗi xảy ra khi xóa nhắc nhở", error: error.message });
    }
});

module.exports = router;
