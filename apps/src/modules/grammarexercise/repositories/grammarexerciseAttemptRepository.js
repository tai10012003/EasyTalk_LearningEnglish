const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

class GrammarExerciseAttemptRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("grammarexerciseattempts");
        this.ensureIndexes();
    }

    ensureIndexes() {
        this.collection.createIndex({ userId: 1, grammarExerciseId: 1, createdAt: -1 }).catch(() => {});
        this.collection.createIndex({ userId: 1, status: 1 }).catch(() => {});
    }

    async insert(attemptData) {
        return await this.collection.insertOne(attemptData);
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async deleteById(id, userId) {
        return await this.collection.deleteOne({
            _id: new ObjectId(id),
            userId: new ObjectId(userId)
        });
    }

    async findHistoryByUser(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = { userId: new ObjectId(userId) };
        const [items, total] = await Promise.all([
            this.collection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            this.collection.countDocuments(filter)
        ]);
        return { items, total };
    }

    async updateAnswer(attemptId, answers, summary) {
        return await this.collection.updateOne(
            { _id: new ObjectId(attemptId) },
            {
                $set: {
                    answers,
                    ...summary,
                    updatedAt: new Date()
                }
            }
        );
    }

    async finish(attemptId, summary) {
        return await this.collection.updateOne(
            { _id: new ObjectId(attemptId) },
            {
                $set: {
                    ...summary,
                    status: "completed",
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}

module.exports = GrammarExerciseAttemptRepository;
