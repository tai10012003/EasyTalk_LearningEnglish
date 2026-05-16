const { ObjectId } = require('mongodb');
const config = require("../../../shared/config/setting");
const DatabaseConnection = require('../../../shared/database/database');

class ReminderRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("reminders");
    }

    async findAll(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = { user: new ObjectId(userId) };
        const [reminders, total] = await Promise.all([
            this.collection.find(filter).sort({ reminderTime: -1 }).skip(skip).limit(limit).toArray(),
            this.collection.countDocuments(filter)
        ]);
        return { reminders, total, currentPage: page, totalPages: Math.ceil(total / limit) };
    }

    async findById(reminderId) {
        return await this.collection.findOne({ _id: new ObjectId(reminderId) });
    }

    async findActiveReminders() {
        return await this.collection.find({ status: "active" }).toArray();
    }

    async insert(reminder) {
        const result = await this.collection.insertOne(reminder);
        return result.insertedId;
    }

    async update(reminderId, updatedFields) {
        const result = await this.collection.updateOne(
            { _id: new ObjectId(reminderId) },
            { $set: updatedFields }
        );
        return result.modifiedCount > 0;
    }

    async delete(reminderId) {
        const result = await this.collection.deleteOne({ 
            _id: new ObjectId(reminderId) 
        });
        return result.deletedCount > 0;
    }
}

module.exports = ReminderRepository;