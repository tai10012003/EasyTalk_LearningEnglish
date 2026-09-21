const { ObjectId } = require('mongodb');

class Notification {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.user = doc.user || null;
        this.title = doc.title || null;
        this.message = doc.message || null;
        this.type = doc.type || 'info';
        this.link = doc.link || null;
        this.isRead = doc.isRead || false;
        this.createdAt = doc.createdAt || null;
        this.expireAt = doc.expireAt || null;
    }

    static validate(doc) {
        const errors = [];
        if (!doc.title) {
            errors.push('title is required');
        }
        if (!doc.message) {
            errors.push('message is required');
        }
        const validTypes = ['info', 'success', 'warning', 'error', 'system', 'achieve', 'champion', 'streak_lost'];
        if (doc.type && !validTypes.includes(doc.type)) {
            errors.push(`type must be one of: ${validTypes.join(', ')}`);
        }
        if (doc.link && typeof doc.link !== 'string') {
            errors.push('link must be a string');
        }
        return errors;
    }

    static buildNotification(userId, title, message, type = 'info', link = null) {
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 7);
        return {
            user: new ObjectId(userId),
            title,
            message,
            type,
            link: link || null,
            isRead: false,
            createdAt: new Date(),
            expireAt,
        };
    }

    static buildBulkNotifications(userIds, title, message, type = 'info', link = null) {
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + 7);
        const createdAt = new Date();
        return userIds.map(userId => ({
            user: new ObjectId(userId),
            title,
            message,
            type,
            link: link || null,
            isRead: false,
            createdAt,
            expireAt,
        }));
    }
}

module.exports = Notification;