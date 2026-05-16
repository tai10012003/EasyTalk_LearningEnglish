const { ObjectId } = require('mongodb');
const config = require("../../../shared/config/setting");
const DatabaseConnection = require('../../../shared/database/database');
const { buildStageQuery } = require('./queries/stageQueries');

class StageRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("stages");
    }

    async findAll(page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const pipeline = buildStageQuery();
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        const stages = await this.collection.aggregate(pipeline).toArray();
        const total = await this.collection.countDocuments();
        return { stages, total };
    }

    async findById(stageId) {
        return await this.collection.findOne({ _id: new ObjectId(stageId) });
    }

    async findByGate(gateId) {
        return await this.collection.find({ gate: new ObjectId(gateId) }).sort({ _id: 1 }).toArray();
    }

    async insert(stageData) {
        const newStage = {
            title: stageData.title,
            gate: new ObjectId(stageData.gate),
            questions: stageData.questions || [],
            createdAt: new Date()
        };
        return await this.collection.insertOne(newStage);
    }

    async update(stageId, updateData) {
        return await this.collection.updateOne(
            { _id: new ObjectId(stageId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
    }

    async delete(stageId) {
        return await this.collection.deleteOne({ _id: new ObjectId(stageId) });
    }

    async deleteByGate(gateId) {
        return await this.collection.deleteMany({ gate: new ObjectId(gateId) });
    }
}

module.exports = StageRepository;