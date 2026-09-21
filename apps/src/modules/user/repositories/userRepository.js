const { ObjectId } = require('mongodb');
const DatabaseConnection = require('../../../shared/database/database');
const config = require('../../../shared/config/setting');

class UserRepository {
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
                    tokenVersion: 1,
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
        user.tokenVersion = user.tokenVersion || 0;
        return await this.collection.insertOne(user);
    }

    async update(id, updateFields) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne(
            { _id: objectId }, 
            { $set: updateFields }
        );
        return result.modifiedCount > 0;
    }

    async updatePassword(id, hashedPassword) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne(
            { _id: objectId },
            {
                $set: { password: hashedPassword },
                $inc: { tokenVersion: 1 }
            }
        );
        return result.modifiedCount > 0;
    }

    async updateAndIncrementTokenVersion(id, updateFields) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne(
            { _id: objectId },
            {
                $set: updateFields,
                $inc: { tokenVersion: 1 }
            }
        );
        return result.modifiedCount > 0;
    }

    async incrementTokenVersion(id) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $inc: { tokenVersion: 1 } }
        );
        return result.modifiedCount > 0;
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = UserRepository;