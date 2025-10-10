const { ObjectId } = require('mongodb');
const config = require("./../config/setting.json");

class StageService {
    databaseConnection = require('./../database/database');
    client;
    stagesDatabase;
    stagesCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.stagesDatabase = this.client.db(config.mongodb.database);
        this.stagesCollection = this.stagesDatabase.collection("stages");
    }

    async getStageList(page = 1, limit = 10) {
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
            {
                $addFields: {
                    "gateInfo.journeyInfo": "$journeyInfo"
                }
            },
            { $project: { journeyInfo: 0 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();
        const totalStages = await this.stagesCollection.countDocuments();
        return { stages, totalStages };
    }
    async getStageById(id) {
        return await this.stagesCollection.findOne({ _id: new ObjectId(id) });
    }
    async getStagesInGate(gateId) {
        return await this.stagesCollection.find({ gate: new ObjectId(gateId) }).sort({ _id: 1 }).toArray();
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
        const formattedQuestions = updateData.questions.map(question => ({
            question: question.question,
            type: question.type,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "",
            options: question.options || [],
        }));

        return await this.stagesCollection.updateOne(
            { _id: new ObjectId(stageId) },
            { $set: { title: updateData.title, gate: updateData.gate, questions: formattedQuestions, updatedAt: new Date() } }
        );
    }

    async deleteStage(id) {
        return await this.stagesCollection.deleteOne({ _id: new ObjectId(id) });
    }
    async deleteStageByGate(gateId) {
        return await this.stagesCollection.deleteMany({ gate: new ObjectId(gateId) });
    }
}

module.exports = StageService;
