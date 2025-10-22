const { ObjectId } = require("mongodb");
const config = require("../config/setting");
const DatabaseConnection = require("../database/database");

class NotificationRepository {
    client;
    db;
    notificationsCollection;
    usersCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.notificationsCollection = this.db.collection("notifications");
        this.usersCollection = this.db.collection("users");
    }

    async createNotification(notification) {
        const result = await this.notificationsCollection.insertOne(notification);
        return result.insertedId;
    }

    async createManyNotifications(notifications) {
        if (!notifications || notifications.length == 0) {
            return { insertedCount: 0, insertedIds: [] };
        }
        return await this.notificationsCollection.insertMany(notifications);
    }

    async getAllUsers() {
        return await this.usersCollection.find({}, { projection: { _id: 1 } }).toArray();
    }

    async findNotificationsByUserId(userId) {
        return await this.notificationsCollection.find({ user: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();
    }

    async findAllNotifications() {
        return await this.notificationsCollection.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userInfo"
            }
        },
        {
            $unwind: {
                path: "$userInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                title: 1,
                message: 1,
                type: 1,
                link: 1,
                isRead: 1,
                createdAt: 1,
                "userInfo._id": 1,
                "userInfo.username": 1,
                "userInfo.email": 1
            }
        },
        { $sort: { createdAt: -1 } }
        ]).toArray();
    }

    async findNotificationById(notificationId) {
        return await this.notificationsCollection.findOne({
            _id: new ObjectId(notificationId),
        });
    }

    async updateNotification(notificationId, updatedFields) {
        const result = await this.notificationsCollection.updateOne(
            { _id: new ObjectId(notificationId) },
            { $set: updatedFields }
        );
        return result.modifiedCount > 0;
    }

    async deleteNotification(notificationId) {
        const result = await this.notificationsCollection.deleteOne({
            _id: new ObjectId(notificationId),
        });
        return result.deletedCount > 0;
    }

    async markAllAsRead(userId) {
        const result = await this.notificationsCollection.updateMany(
            { user: new ObjectId(userId), isRead: false },
            { $set: { isRead: true } }
        );
        return result.modifiedCount;
    }
}

module.exports = NotificationRepository;