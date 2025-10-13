const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('./../config/setting.json');

class UserprogressRepository {
    client;
    db;
    collection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("userprogresses");
    }

    async findByUserId(userId) {
        return await this.collection.findOne({ user: new ObjectId(userId) });
    }

    async insert(userProgress) {
        return await this.collection.insertOne(userProgress);
    }

    async update(userId, updateFields, upsert = true) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $set: updateFields },
            { upsert }
        );
    }

    async delete(userId) {
        const result = await this.collection.deleteOne({ user: new ObjectId(userId) });
        return result.deletedCount > 0;
    }

    async getLeaderboard(limit = 10) {
        return await this.collection.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$user",
                    experiencePoints: { $max: "$experiencePoints" },
                    username: { $first: "$userDetails.username" }
                }
            },
            { $sort: { experiencePoints: -1 } },
            { $limit: limit }
        ]).toArray();
    }
}

module.exports = UserprogressRepository;