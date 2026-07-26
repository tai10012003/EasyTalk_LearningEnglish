const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class AgentSessionRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("agentsessions");
    }

    async insert(session) {
        const result = await this.collection.insertOne(session);
        return result.insertedId;
    }

    async findById(sessionId) {
        if (!ObjectId.isValid(sessionId)) return null;
        return await this.collection.findOne({ _id: new ObjectId(sessionId) });
    }

    async findByIdForUser(sessionId, userId) {
        if (!ObjectId.isValid(sessionId)) return null;
        return await this.collection.findOne({
            _id: new ObjectId(sessionId),
            user: new ObjectId(userId)
        });
    }

    async pushMessages(sessionId, messages) {
        return await this.collection.updateOne(
            { _id: new ObjectId(sessionId) },
            {
                $push: { messages: { $each: messages } },
                $set: { updatedAt: new Date() }
            }
        );
    }

    async completeSession(sessionId, data) {
        return await this.collection.updateOne(
            { _id: new ObjectId(sessionId) },
            {
                $set: {
                    status: 'completed',
                    summary: data.summary || null,
                    mistakes: data.mistakes || [],
                    recommendedNextActions: data.recommendedNextActions || [],
                    endedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}

module.exports = AgentSessionRepository;
