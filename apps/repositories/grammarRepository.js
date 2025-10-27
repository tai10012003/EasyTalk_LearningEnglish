const { ObjectId } = require('mongodb');
const DatabaseConnection = require('./../database/database');
const config = require('../config/setting');

class GrammarRepository {
    client;
    db;
    collection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("grammars");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const cursor = await this.collection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const grammars = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { grammars, total };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findBySlug(slug) {
        return await this.collection.findOne({ slug });
    }

    async insert(grammar) {
        return await this.collection.insertOne(grammar);
    }

    async update(id, updateData) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne({ _id: objectId }, { $set: updateData });
        return result.modifiedCount > 0;
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = GrammarRepository;