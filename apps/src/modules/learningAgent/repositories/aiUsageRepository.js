const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class AIUsageRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("aiusages");
    }

    async insert(usage) {
        return await this.collection.insertOne(usage);
    }

    async countByUserAndDate(userId, date) {
        return await this.collection.countDocuments({
            user: new ObjectId(userId),
            date
        });
    }

    async countByUserDateAndTask(userId, date, task) {
        return await this.collection.countDocuments({
            user: new ObjectId(userId),
            date,
            task
        });
    }

    async getDailySummary(userId, date) {
        const [summary] = await this.collection.aggregate([
            {
                $match: {
                    user: new ObjectId(userId),
                    date
                }
            },
            {
                $group: {
                    _id: null,
                    requests: { $sum: 1 },
                    inputTokens: { $sum: "$inputTokens" },
                    outputTokens: { $sum: "$outputTokens" },
                    totalTokens: { $sum: "$totalTokens" },
                    estimatedCostUsd: { $sum: "$estimatedCostUsd" }
                }
            },
            {
                $project: {
                    _id: 0,
                    requests: 1,
                    inputTokens: 1,
                    outputTokens: 1,
                    totalTokens: 1,
                    estimatedCostUsd: 1
                }
            }
        ]).toArray();

        return summary || {
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0
        };
    }

    async getGlobalDailySummary(date) {
        const [summary] = await this.collection.aggregate([
            {
                $match: { date }
            },
            {
                $group: {
                    _id: null,
                    requests: { $sum: 1 },
                    inputTokens: { $sum: "$inputTokens" },
                    outputTokens: { $sum: "$outputTokens" },
                    totalTokens: { $sum: "$totalTokens" },
                    estimatedCostUsd: { $sum: "$estimatedCostUsd" },
                    uniqueUsers: { $addToSet: "$user" }
                }
            },
            {
                $project: {
                    _id: 0,
                    requests: 1,
                    inputTokens: 1,
                    outputTokens: 1,
                    totalTokens: 1,
                    estimatedCostUsd: 1,
                    uniqueUsers: { $size: "$uniqueUsers" }
                }
            }
        ]).toArray();

        return summary || {
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
            uniqueUsers: 0
        };
    }

    async findRecent(limit = 20) {
        return await this.collection
            .find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .project({
                user: 1,
                date: 1,
                task: 1,
                provider: 1,
                mode: 1,
                model: 1,
                inputTokens: 1,
                outputTokens: 1,
                totalTokens: 1,
                estimatedCostUsd: 1,
                metadata: 1,
                createdAt: 1
            })
            .toArray();
    }
}

module.exports = AIUsageRepository;
