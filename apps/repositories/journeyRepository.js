const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const DatabaseConnection = require('./../database/database');

class JourneyRepository {
    client;
    db;
    journeysCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.journeysCollection = this.db.collection("journeys");
    }

    async findJourneys(page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.journeysCollection.find({}).skip(skip).limit(limit);
        const journeys = await cursor.toArray();
        const totalJourneys = await this.journeysCollection.countDocuments();
        return { journeys, totalJourneys };
    }

    async findAllJourneysWithDetails() {
        return await this.journeysCollection.aggregate([
            {
                $lookup: {
                    from: 'gates',
                    localField: '_id',
                    foreignField: 'journey',
                    as: 'gates'
                }
            },
            { $unwind: { path: "$gates", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'stages',
                    localField: 'gates._id',
                    foreignField: 'gate',
                    as: 'gates.stages'
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    createdAt: { $first: "$createdAt" },
                    gates: { $push: "$gates" }
                }
            }
        ]).toArray();
    }

    async findJourneyWithDetails(journeyId) {
        return await this.journeysCollection.aggregate([
            { $match: { _id: new ObjectId(journeyId) } },
            {
                $lookup: {
                    from: 'gates',
                    localField: 'gates',
                    foreignField: '_id',
                    as: 'gates'
                }
            },
            { $unwind: { path: "$gates", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'stages',
                    localField: 'gates.stages',
                    foreignField: '_id',
                    as: 'gates.stages'
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    gates: { $push: "$gates" }
                }
            }
        ]).toArray().then(result => result[0]);
    }

    async findJourneyById(id) {
        return await this.journeysCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertJourney(journey) {
        journey.createdAt = new Date();
        journey.gates = [];
        return await this.journeysCollection.insertOne(journey);
    }

    async addGate(journeyId, gateId) {
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $addToSet: { gates: new ObjectId(gateId) } }
        );
    }

    async removeGate(journeyId, gateId) {
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $pull: { gates: new ObjectId(gateId) } }
        );
    }

    async updateJourney(journey) {
        const { _id, ...updateData } = journey;
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );
    }

    async deleteJourney(id) {
        return await this.journeysCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = JourneyRepository;