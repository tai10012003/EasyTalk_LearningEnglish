const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('../config/setting');

class PrizeRepository {
    client;
    db;
    collection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("prizes");
    }

    async findPrizeList(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.collection.find(filter).sort({ type: 1, level: 1 }).skip(skip).limit(limit);
        const prizes = await cursor.toArray();
        const totalPrizes = await this.collection.countDocuments(filter);
        return { prizes, totalPrizes };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findByCode(code) {
        return await this.collection.findOne({ code });
    }

    async findByType(type) {
        return await this.collection.find({ type }).sort({ level: 1 }).toArray();
    }

    async findAllPrizes() {
        return await this.collection.find({}).sort({ type: 1, level: 1 }).toArray();
    }

    async insert(prize) {
        const now = new Date();
        prize.createdAt = now;
        prize.updatedAt = now;
        return await this.collection.insertOne(prize);
    }

    async update(id, updateData) {
        updateData.updatedAt = new Date();
        return await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PrizeRepository;