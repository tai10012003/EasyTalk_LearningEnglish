const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

class PronunciationExerciseRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("pronunciationexercises");
    }

    async findAll(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.collection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const exercises = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { exercises, total };
    }

    async findById(id) {
        if (!ObjectId.isValid(id)) {
            return null;
        }
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

    async insert(exerciseData) {
        return await this.collection.insertOne(exerciseData);
    }

    async update(id, updateData) {
        const objectId = new ObjectId(id);
        return await this.collection.updateOne({ _id: objectId }, { $set: updateData });
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PronunciationExerciseRepository;
