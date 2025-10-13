const { ObjectId } = require('mongodb');
const config = require('./../config/setting.json');
const DatabaseConnection = require('./../database/database');

class DictationRepository {
    client;
    db;
    dictationCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.dictationCollection = this.db.collection("dictationexercises");
    }

    async findDictations(page = 1, limit = 6) {
        const skip = (page - 1) * limit;
        const cursor = await this.dictationCollection.find({}).skip(skip).limit(limit);
        const dictationExercises = await cursor.toArray();
        const totalDictationExercises = await this.dictationCollection.countDocuments();
        return { dictationExercises, totalDictationExercises };
    }

    async findDictationById(id) {
        return await this.dictationCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertDictation(dictationData) {
        dictationData.createdAt = new Date();
        return await this.dictationCollection.insertOne(dictationData);
    }

    async updateDictation(dictationData) {
        const { _id, ...updateFields } = dictationData;
        return await this.dictationCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateFields }
        );
    }

    async deleteDictation(id) {
        return await this.dictationCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = DictationRepository;