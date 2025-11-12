const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('../config/setting');

class UserRepository {
    client;
    db;
    collection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("users");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const cursor = await this.collection.aggregate([
            { $match: filter },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    username: 1,
                    email: 1,
                    role: 1,
                    active: 1,
                    createdAt: 1,
                    lastActive: 1
                }
            }
        ]);
        const users = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { users, total };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByEmail(email) {
        return await this.collection.findOne({ email });
    }

    async insert(user) {
        user.createdAt = new Date();
        user.lastActive = new Date();
        return await this.collection.insertOne(user);
    }

    async update(id, updateFields) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne({ _id: objectId }, { $set: updateFields });
        return result.modifiedCount > 0;
    }

    async updatePassword(id, hashedPassword) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $set: { password: hashedPassword } }
        );
        return result.modifiedCount > 0;
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = UserRepository;