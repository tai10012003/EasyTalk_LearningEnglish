const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class AgentLearningEventRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("agentlearningevents");
    }

    async insert(event) {
        return await this.collection.insertOne(event);
    }

    async findRecentByUser(userId, limit = 20) {
        return await this.collection
            .find({ user: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    }

    async findByUserSince(userId, sinceDate, limit = 200) {
        return await this.collection
            .find({
                user: new ObjectId(userId),
                createdAt: { $gte: sinceDate }
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    }
}

module.exports = AgentLearningEventRepository;
