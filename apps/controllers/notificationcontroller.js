const express = require("express");
const router = express.Router();
const verifyToken = require("../util/VerifyToken");
const { NotificationService } = require("../services");
const notificationService = new NotificationService();

router.get("/api/notifications", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await notificationService.getNotificationsByUserId(userId);
        res.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách thông báo cho người dùng", error: error.message });
    }
});

router.get("/api/admin/notifications", verifyToken, async (req, res) => {
    try {
        const notifications = await notificationService.getAllNotifications();
        res.json({ notifications });
    } catch (error) {
        console.error("Error fetching all notifications:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách thông báo", error: error.message });
    }
});

router.get("/api/:id", verifyToken, async (req, res) => {
    try {
        const notification = await notificationService.getNotificationById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json(notification);
    } catch (error) {
        console.error("Error fetching notification:", error);
        res.status(500).json({ message: "Lỗi khi lấy thông báo", error: error.message });
    }
});

router.post("/api/add", verifyToken, async (req, res) => {
    try {
        const { title, message, type, link, user } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: "Tiêu đề và nội dung không được bỏ trống" });
        }
        if (!user || user == "" || user == null) {
            const result = await notificationService.createNotificationForAll(title, message, type, link);
            return res.status(201).json({ 
                message: `Đã tạo ${result.count} thông báo cho tất cả người dùng!`,
                notification: result,
                count: result.count
            });
        }
        const insertedId = await notificationService.createNotification(user, title, message, type, link);
        res.status(201).json({ 
            message: "Thông báo đã được tạo thành công cho 1 người dùng!", 
            notification: { _id: insertedId },
            notificationId: insertedId
        });
    } catch (error) {
        console.error("❌ Error creating notification:", error);
        res.status(500).json({ message: "Lỗi khi tạo thông báo", error: error.message });
    }
});

router.put("/api/read/:id", verifyToken, async (req, res) => {
    try {
        const updated = await notificationService.markAsRead(req.params.id);
        if (!updated) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được đánh dấu là đã đọc" });
    } catch (error) {
        console.error("Error marking as read:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật thông báo", error: error.message });
    }
});

router.put("/api/un-read/:id", verifyToken, async (req, res) => {
    try {
        const updated = await notificationService.markAsUnRead(req.params.id);
        if (!updated) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được đánh dấu là chưa đọc" });
    } catch (error) {
        console.error("Error marking as read:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật thông báo", error: error.message });
    }
});

router.put("/api/read-all", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await notificationService.markAllAsRead(userId);
        res.json({ message: `Đã đánh dấu ${count} thông báo là đã đọc.` });
    } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: "Lỗi khi đánh dấu tất cả thông báo", error: error.message });
    }
});

router.delete("/api/delete/:id", verifyToken, async (req, res) => {
    try {
        const deleted = await notificationService.deleteNotification(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được xóa thành công!" });
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ message: "Lỗi khi xóa thông báo", error: error.message });
    }
});

module.exports = router;