const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class GrammarsService {
    databaseConnection = require('./../database/database');
    grammars = require('./../models/grammar');

    client;
    grammarsDatabase;
    grammarsCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.grammarsDatabase = this.client.db(config.mongodb.database);
        this.grammarsCollection = this.grammarsDatabase.collection("grammars");
    }

    async getGrammarList(page = 1, limit = 5, search = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }
        const cursor = await this.grammarsCollection
            .find(filter, {})
            .skip(skip)
            .limit(limit);
        const grammars = await cursor.toArray();
        const totalGrammars = await this.grammarsCollection.countDocuments(filter);
        return {
            grammars,
            totalGrammars,
        };
    }

    async getGrammar(id) {
        return await this.grammarsCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertGrammar(grammar) {
        grammar.createdAt = new Date();
        return await this.grammarsCollection.insertOne(grammar);
    }

    async updateGrammar(grammar) {
        return await this.grammarsCollection.updateOne(
            { _id: new ObjectId(grammar._id) },
            { $set: grammar }
        );
    }

    async deleteGrammar(id) {
        return await this.grammarsCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = GrammarsService;
