const { ObjectId } = require("mongodb");
const { NotificationRepository } = require("../repositories");

class NotificationService {
    constructor() {
        this.notificationRepository = new NotificationRepository();
    }

    async createNotification(userId, title, message, type = "info", link = null) {
        const notification = {
            user: new ObjectId(userId),
            title,
            message,
            type,
            link: link || null,
            isRead: false,
            createdAt: new Date(),
        };
        const insertedId = await this.notificationRepository.createNotification(notification);
        return insertedId;
    }

    async createNotificationForAll(title, message, type = "info", link = null) {
        try {
            const users = await this.notificationRepository.getAllUsers();
            const normalUsers = users.filter(u => u.role == "user");
            if (normalUsers.length == 0) {
                return { count: 0, insertedIds: [] };
            }
            const notifications = normalUsers.map(user => ({
                user: new ObjectId(user._id),
                title,
                message,
                type,
                link: link || null,
                isRead: false,
                createdAt: new Date(),
            }));
            const result = await this.notificationRepository.createManyNotifications(notifications);
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
}

module.exports = NotificationService;