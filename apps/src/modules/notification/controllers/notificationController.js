const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const NotificationService = require("../services/notificationService");
const { validateCreateNotification } = require("../validators/notificationValidator");
const { getIo } = require("../../../shared/utils/socket");
const io = getIo();
const notificationService = new NotificationService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");
notificationService.setSocketIO(io);

router.get("/api/notifications", verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const notifications = await notificationService.getNotificationsByUserId(userId);
        res.json({ notifications });
}));

router.get("/api/admin/notifications", verifyAdmin, asyncHandler(async (req, res) => {
        const notifications = await notificationService.getAllNotifications();
        res.json({ notifications });
}));

router.get("/api/:id", verifyToken, asyncHandler(async (req, res) => {
        const notification = await notificationService.getNotificationById(req.params.id);
        if (!notification) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json(notification);
}));

router.post("/api/add", verifyAdmin, asyncHandler(async (req, res) => {
        const { title, message, type, link, user } = req.body;
        const validation = validateCreateNotification({ title, message, type });
        if (!validation.valid) {
            return res.status(400).json({ message: validation.errors.join(', ') });
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
}));

router.put("/api/read/:id", verifyToken, asyncHandler(async (req, res) => {
        const updated = await notificationService.markAsRead(req.params.id);
        if (!updated) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được đánh dấu là đã đọc" });
}));

router.put("/api/un-read/:id", verifyToken, asyncHandler(async (req, res) => {
        const updated = await notificationService.markAsUnRead(req.params.id);
        if (!updated) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được đánh dấu là chưa đọc" });
}));

router.put("/api/read-all", verifyToken, asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const count = await notificationService.markAllAsRead(userId);
        res.json({ message: `Đã đánh dấu ${count} thông báo là đã đọc.` });
}));

router.delete("/api/delete/:id", verifyToken, asyncHandler(async (req, res) => {
        const deleted = await notificationService.deleteNotification(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Không tìm thấy thông báo" });
        res.json({ message: "Thông báo đã được xóa thành công!" });
}));

module.exports = router;