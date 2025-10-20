const { ObjectId } = require('mongodb');
const config = require("../config/setting");
const DatabaseConnection = require('./../database/database');

class ReminderRepository {
    client;
    db;
    remindersCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.remindersCollection = this.db.collection("reminders");
    }

    async createReminder(reminder) {
        const result = await this.remindersCollection.insertOne(reminder);
        return result.insertedId;
    }

    async findRemindersByUserId(userId) {
        return await this.remindersCollection.find({ user: userId }).toArray();
    }

    async findReminderById(reminderId) {
        return await this.remindersCollection.findOne({ _id: new ObjectId(reminderId) });
    }

    async updateReminder(reminderId, updatedFields) {
        const result = await this.remindersCollection.updateOne(
            { _id: new ObjectId(reminderId) },
            { $set: updatedFields }
        );
        return result.modifiedCount > 0;
    }

    async deleteReminder(reminderId) {
        const result = await this.remindersCollection.deleteOne({ _id: new ObjectId(reminderId) });
        return result.deletedCount > 0;
    }
}

module.exports = ReminderRepository;