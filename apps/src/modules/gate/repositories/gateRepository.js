const { ObjectId } = require("mongodb");
const config = require("../../../shared/config/setting");
const DatabaseConnection = require('../../../shared/database/database');
const { buildGateListQuery } = require('./queries/gateQueries');

class GateRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("gates");
    }

    async findAll(page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const pipeline = buildGateListQuery();
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        const gates = await this.collection.aggregate(pipeline).toArray();
        const total = await this.collection.countDocuments();
        return { gates, total };
    }

    async findById(gateId) {
        return await this.collection.findOne({ _id: new ObjectId(gateId) });
    }

    async findByJourney(journeyId) {
        return await this.collection.find({ journey: new ObjectId(journeyId) }).sort({ _id: 1 }).toArray();
    }

    async insert(gate) {
        gate.stages = gate.stages || [];
        gate.createdAt = new Date();
        return await this.collection.insertOne(gate);
    }

    async update(id, updateData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteByJourney(journeyId) {
        return await this.collection.deleteMany({ journey: new ObjectId(journeyId) });
    }

    async addStage(gateId, stageId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(gateId) },
            { $addToSet: { stages: new ObjectId(stageId) } }
        );
    }

    async removeStage(gateId, stageId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(gateId) },
            { $pull: { stages: new ObjectId(stageId) } }
        );
    }
}

module.exports = GateRepository;