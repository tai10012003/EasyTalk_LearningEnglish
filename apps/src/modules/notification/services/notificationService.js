const { ObjectId } = require("mongodb");
const NotificationRepository = require("../repositories/notificationRepository");
const logger = require("../../../shared/utils/logger");

class NotificationService {
    constructor(deps = {}) {
        const options = deps && typeof deps.emit === 'function' ? { io: deps } : (deps || {});
        this.notificationRepository = options.repository || new NotificationRepository();
        this.io = options.io || null;
    }

    setSocketIO(io) {
        this.io = io;
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
        if (this.io) {
            this.io.to(`user:${userId.toString()}`).emit("new-notification", {
                _id: insertedId,
                ...notification
            });
            logger.debug("Notification emitted realtime", { userId: userId.toString(), notificationId: insertedId.toString() });
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
            if (this.io) {
                normalUsers.forEach(user => {
                    const notifIndex = notifications.findIndex(n => n.user.toString() == user._id.toString());
                    if (notifIndex === -1) return;
                    const insertedId = result.insertedIds?.[notifIndex];
                    this.io.to(`user:${user._id.toString()}`).emit("new-notification", {
                        _id: insertedId,
                        ...notifications[notifIndex]
                    });
                    logger.debug("Notification emitted realtime", {
                        userId: user._id.toString(),
                        notificationId: insertedId?.toString()
                    });
                });
            }
            return { count: result.insertedCount, insertedIds: result.insertedIds };
        } catch (error) {
            logger.error("Error creating notifications for all users", { message: error.message });
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
            logger.error("Error deleting notifications by user", { userId: userId.toString(), message: error.message });
            throw error;
        }
    }
}

module.exports = NotificationService;