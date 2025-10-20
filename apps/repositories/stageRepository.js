const { ObjectId } = require('mongodb');
const config = require("../config/setting");
const DatabaseConnection = require('./../database/database');

class StageRepository {
    client;
    db;
    stagesCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.stagesCollection = this.db.collection("stages");
    }

    async findStages(page = 1, limit = 12) {
        const skip = (page - 1) * limit;

        const stages = await this.stagesCollection.aggregate([
            {
                $lookup: {
                    from: "gates",
                    localField: "gate",
                    foreignField: "_id",
                    as: "gateInfo"
                }
            },
            { $unwind: { path: "$gateInfo", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "journeys",
                    localField: "gateInfo.journey",
                    foreignField: "_id",
                    as: "journeyInfo"
                }
            },
            { $unwind: { path: "$journeyInfo", preserveNullAndEmptyArrays: true } },
            { $addFields: { "gateInfo.journeyInfo": "$journeyInfo" } },
            { $project: { journeyInfo: 0 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        const totalStages = await this.stagesCollection.countDocuments();
        return { stages, totalStages };
    }

    async findStageById(stageId) {
        return await this.stagesCollection.findOne({ _id: new ObjectId(stageId) });
    }

    async findStagesByGate(gateId) {
        return await this.stagesCollection.find({ gate: new ObjectId(gateId) })
            .sort({ _id: 1 })
            .toArray();
    }

    async insertStage(stageData) {
        const newStage = {
            title: stageData.title,
            gate: new ObjectId(stageData.gate),
            questions: stageData.questions || [],
            createdAt: new Date()
        };
        return await this.stagesCollection.insertOne(newStage);
    }

    async updateStage(stageId, updateData) {
        const formattedQuestions = (updateData.questions || []).map(question => ({
            question: question.question,
            type: question.type,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "",
            options: question.options || [],
        }));

        return await this.stagesCollection.updateOne(
            { _id: new ObjectId(stageId) },
            { $set: { title: updateData.title, gate: new ObjectId(updateData.gate), questions: formattedQuestions, updatedAt: new Date() } }
        );
    }

    async deleteStage(stageId) {
        return await this.stagesCollection.deleteOne({ _id: new ObjectId(stageId) });
    }

    async deleteStagesByGate(gateId) {
        return await this.stagesCollection.deleteMany({ gate: new ObjectId(gateId) });
    }
}

module.exports = StageRepository;