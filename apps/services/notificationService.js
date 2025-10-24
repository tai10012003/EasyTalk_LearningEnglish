const { ObjectId } = require("mongodb");
const { NotificationRepository } = require("../repositories");
const { getIo } = require("../util/socket");

class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
        this.io = getIo();
    }

    async createNotification(userId, title, message, type = "info", link = null) {
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 7);
        const notification = {
            user: new ObjectId(userId),
            title,
            message,
            type,
            link: link || null,
            isRead: false,
            createdAt: new Date(),
            expireAt,
        };
        const insertedId = await this.notificationRepository.createNotification(notification);
        const socketId = global.onlineUsers.get(userId.toString());
        if (socketId) {
            this.io.to(socketId).emit("new-notification", { 
                _id: insertedId,
                ...notification
            });
            console.log(`🔔 Notification đã gửi realtime cho user ${userId}`);
        } else {
            console.log(`⚠️ User ${userId} not online. Notification will be received on next page load.`);
        }
        return insertedId;
    }

    async createNotificationForAll(title, message, type = "info", link = null) {
        try {
            const users = await this.notificationRepository.getAllUsers();
            const normalUsers = users.filter(u => u.role == "user");
            if (normalUsers.length == 0) {
                return { count: 0, insertedIds: [] };
            }
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7);
            const notifications = normalUsers.map(user => ({
                user: new ObjectId(user._id),
                title,
                message,
                type,
                link: link || null,
                isRead: false,
                createdAt: new Date(),
                expireAt,
            }));
            const result = await this.notificationRepository.createManyNotifications(notifications);
            normalUsers.forEach(user => {
                const socketId = global.onlineUsers.get(user._id.toString());
                if (socketId) {
                    const notif = notifications.find(n => n.user.toString() == user._id.toString());
                    this.io.to(socketId).emit("new-notification", { _id: notif._id, ...notif });
                    console.log(`🔔 Notification đã gửi realtime cho user ${user._id}`);
                }
            });
            return { count: result.insertedCount, insertedIds: result.insertedIds };
        } catch (error) {
            console.error("Error creating notifications for all users:", error);
            throw error;
        }
    }

    async getNotificationsByUserId(userId) {
        return await this.notificationRepository.findNotificationsByUserId(userId);
    }

    async getAllNotifications() {
        return await this.notificationRepository.findAllNotifications();
    }

    async getNotificationById(notificationId) {
        return await this.notificationRepository.findNotificationById(notificationId);
    }

    async markAsRead(notificationId) {
        return await this.notificationRepository.updateNotification(notificationId, { isRead: true });
    }

    async markAsUnRead(notificationId) {
        return await this.notificationRepository.updateNotification(notificationId, { isRead: false });
    }

    async markAllAsRead(userId) {
        return await this.notificationRepository.markAllAsRead(userId);
    }

    async deleteNotification(notificationId) {
        return await this.notificationRepository.deleteNotification(notificationId);
    }

    async deleteNotificationsByUser(userId) {
        try {
            const result = await this.notificationRepository.deleteManyByUser(userId);
            return result;
        } catch (error) {
            console.error("Lỗi khi xóa thông báo của user:", error);
            throw error;
        }
    }
}

module.exports = NotificationService;