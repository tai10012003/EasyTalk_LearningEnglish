const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');
const { buildAllJourneysWithDetailsQuery, buildJourneyWithDetailsQuery } = require('./queries/journeyQueries');

class JourneyRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("journeys");
    }

    async findAll(page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.collection.find({}).skip(skip).limit(limit);
        const journeys = await cursor.toArray();
        const total = await this.collection.countDocuments();
        return { journeys, total };
    }

    async findAllWithDetails() {
        const pipeline = buildAllJourneysWithDetailsQuery();
        return await this.collection.aggregate(pipeline).toArray();
    }

    async findByIdWithDetails(journeyId) {
        const pipeline = buildJourneyWithDetailsQuery(journeyId);
        const result = await this.collection.aggregate(pipeline).toArray();
        return result[0] || null;
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async insert(journey) {
        journey.createdAt = new Date();
        journey.gates = journey.gates || [];
        return await this.collection.insertOne(journey);
    }

    async addGate(journeyId, gateId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $addToSet: { gates: new ObjectId(gateId) } }
        );
    }

    async removeGate(journeyId, gateId) {
        return await this.collection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $pull: { gates: new ObjectId(gateId) } }
        );
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
}

module.exports = JourneyRepository;