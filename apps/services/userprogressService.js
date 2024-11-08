const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class UserProgressService {
    databaseConnection = require('./../database/database');
    userprogresses = require('./../models/userprogress');

    client;
    userprogressDatabase;
    userprogressCollection;
    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.userprogressDatabase = this.client.db(config.mongodb.database);
        this.userprogressCollection = this.userprogressDatabase.collection("userprogresses");
    }

    async getLeaderboard(limit = 10) {
        return await this.userprogressCollection.aggregate([
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

    async createUserProgress(userId, journey) {
        const firstGate = journey.gates && journey.gates.length > 0 ? journey.gates[0]._id : null;
        const firstStage = journey.gates[0]?.stages && journey.gates[0].stages.length > 0 ? journey.gates[0].stages[0]._id : null;

        const userProgress = {
            user: new ObjectId(userId),
            unlockedGates: firstGate ? [firstGate] : [],
            unlockedStages: firstStage ? [firstStage] : [],
            experiencePoints: 0
        };

        await this.userprogressCollection.insertOne(userProgress);
        return userProgress;
    }

    async getUserProgressByUserId(userId) {
        return await this.userprogressCollection.findOne({ user: new ObjectId(userId) });
    }
    async unlockJourneyInitial(userProgress, journey) {
        const firstGate = journey.gates && journey.gates.length > 0 ? journey.gates[0]._id : null;
        const firstStage = journey.gates[0]?.stages && journey.gates[0].stages.length > 0 ? journey.gates[0].stages[0]._id : null;
        let isUpdated = false;

        // Check if the first gate of this journey is unlocked
        if (firstGate && !userProgress.unlockedGates.includes(firstGate)) {
            userProgress.unlockedGates.push(firstGate);
            isUpdated = true;
        }

        // Check if the first stage of this journey is unlocked
        if (firstStage && !userProgress.unlockedStages.includes(firstStage)) {
            userProgress.unlockedStages.push(firstStage);
            isUpdated = true;
        }

        if (isUpdated) {
            await this.updateUserProgress(userProgress);
        }

        return userProgress;
    }

    async updateUserProgress(userProgress) {
        userProgress.unlockedGates = [...new Set(userProgress.unlockedGates.map(id => id.toString()))].map(id => new ObjectId(id));
        userProgress.unlockedStages = [...new Set(userProgress.unlockedStages.map(id => id.toString()))].map(id => new ObjectId(id));
        return await this.userprogressCollection.updateOne(
            { user: userProgress.user },
            { $set: { unlockedGates: userProgress.unlockedGates, unlockedStages: userProgress.unlockedStages,  experiencePoints: userProgress.experiencePoints } },
            { upsert: true }
        );
    }

    // Xóa tiến trình của người dùng
    async deleteUserProgress(userId) {
        try {
            const result = await this.userprogressCollection.deleteOne({ user: new ObjectId(userId) });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("Error deleting user progress:", error);
            throw error;
        }
    }
}

module.exports = UserProgressService;
