const { ObjectId } = require('mongodb');
const config = require("./../config/setting.json");

class DictationService {
    databaseConnection = require('./../database/database');
    dictationexercises = require('./../models/dictationexercise');

    client;
    dictationDatabase;
    dictationCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.dictationDatabase = this.client.db(config.mongodb.database);
        this.dictationCollection = this.dictationDatabase.collection("dictationexercises");
    }

    async getDictationList(page = 1, limit = 2) {
        const skip = (page - 1) * limit;
        const cursor = await this.dictationCollection
            .find({})
            .skip(skip)
            .limit(limit);
    
        const dictationExercises = await cursor.toArray();
        const totalDictationExercises = await this.dictationCollection.countDocuments();
        return {
            dictationExercises,
            totalDictationExercises,
        };
    }    

    async getDictation(id) {
        return await this.dictationCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertDictation(dictation) {
        dictation.createdAt = new Date();
        return await this.dictationCollection.insertOne(dictation);
    }

    async updateDictation(dictation) {
        const { _id, ...updateFields } = dictation;
        return await this.dictationCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateFields }
        );
    }

    async deleteDictation(id) {
        return await this.dictationCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = DictationService;
