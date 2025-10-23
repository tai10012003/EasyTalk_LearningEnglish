const { ObjectId } = require("mongodb");
const config = require("../config/setting");
const DatabaseConnection = require('./../database/database');

class GateRepository {
    client;
    db;
    gatesCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.gatesCollection = this.db.collection("gates");
    }

    async findGates(page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const gates = await this.gatesCollection.aggregate([
            {
                $lookup: {
                    from: "journeys",
                    localField: "journey",
                    foreignField: "_id",
                    as: "journeyInfo"
                }
            },
            { $unwind: { path: "$journeyInfo", preserveNullAndEmptyArrays: true } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();
        const totalGates = await this.gatesCollection.countDocuments();
        return { gates, totalGates };
    }

    async findGateById(gateId) {
        return await this.gatesCollection.findOne({ _id: new ObjectId(gateId) });
    }

    async findGatesByJourney(journeyId) {
        return await this.gatesCollection.find({ journey: new ObjectId(journeyId) })
            .sort({ _id: 1 })
            .toArray();
    }

    async insertGate(gate) {
        gate.stages = [];
        gate.createdAt = new Date();
        return await this.gatesCollection.insertOne(gate);
    }

    async updateGate(gate) {
        const { _id, ...updateData } = gate;
        return await this.gatesCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );
    }

    async deleteGate(id) {
        return await this.gatesCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteGatesByJourney(journeyId) {
        return await this.gatesCollection.deleteMany({ journey: new ObjectId(journeyId) });
    }

    async addStage(gateId, stageId) {
        return await this.gatesCollection.updateOne(
            { _id: new ObjectId(gateId) },
            { $addToSet: { stages: new ObjectId(stageId) } }
        );
    }

    async removeStage(gateId, stageId) {
        return await this.gatesCollection.updateOne(
            { _id: new ObjectId(gateId) },
            { $pull: { stages: new ObjectId(stageId) } }
        );
    }
}

module.exports = GateRepository;