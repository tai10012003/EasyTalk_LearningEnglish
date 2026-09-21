const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class AgentModeRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("agentmodes");
    }

    async findAll(filter = {}) {
        return await this.collection
            .find(filter)
            .sort({ sort: 1, title: 1 })
            .toArray();
    }

    async findByKey(key, activityType = null) {
        const query = { key };
        if (activityType) query.activityType = activityType;
        return await this.collection.findOne(query);
    }

    async upsertByKey(mode) {
        const { createdAt, ...updates } = mode;
        return await this.collection.updateOne(
            { key: mode.key, activityType: mode.activityType },
            { $set: updates, $setOnInsert: { createdAt: createdAt || new Date() } },
            { upsert: true }
        );
    }
}

module.exports = AgentModeRepository;
