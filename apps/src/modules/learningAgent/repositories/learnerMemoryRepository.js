const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class LearnerMemoryRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("learnermemories");
    }

    async findByUserId(userId) {
        return await this.collection.findOne({ user: new ObjectId(userId) });
    }

    async insert(memory) {
        return await this.collection.insertOne(memory);
    }

    async update(userId, updateFields, upsert = true) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $set: updateFields, $setOnInsert: { user: new ObjectId(userId), createdAt: new Date() } },
            { upsert }
        );
    }

    async deleteByUserId(userId) {
        const result = await this.collection.deleteOne({ user: new ObjectId(userId) });
        return result.deletedCount > 0;
    }
}

module.exports = LearnerMemoryRepository;
