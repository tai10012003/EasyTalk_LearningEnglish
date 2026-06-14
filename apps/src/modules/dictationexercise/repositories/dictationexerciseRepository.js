const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

class DictationExerciseRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("dictationexercises");
    }

    async findAll(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.collection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const dictations = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { dictations, total };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findBySlug(slug) {
        return await this.collection.findOne({ slug });
    }

    async findNextBySortOrder(currentSort) {
        return await this.collection.findOne(
            { display: true, sort: { $gt: currentSort } },
            { sort: { sort: 1 } }
        );
    }

    async insert(dictationData) {
        dictationData.createdAt = new Date();
        return await this.collection.insertOne(dictationData);
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

module.exports = DictationExerciseRepository;