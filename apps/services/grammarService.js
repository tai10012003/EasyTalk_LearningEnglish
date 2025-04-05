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

    async getGrammarList(page = 1, limit = 5) {
        const skip = (page - 1) * limit;
        const cursor = await this.grammarsCollection
            .find({}, {})
            .skip(skip)
            .limit(limit);

        const grammars = await cursor.toArray();
        const totalGrammars = await this.grammarsCollection.countDocuments();
        return {
            grammars,
            totalGrammars,
        };
    }

    async getGrammar(id) {
        return await this.grammarsCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertGrammar(grammar) {
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 10MB
        if (grammar.images && grammar.images.length > MAX_IMAGE_SIZE) {
            throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh có kích thước nhỏ hơn 5MB.");
        }
    
        grammar.createdAt = new Date();
        return await this.grammarsCollection.insertOne(grammar);
    }
    
    async updateGrammar(grammar) {
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 10MB
        if (grammar.images && grammar.images.length > MAX_IMAGE_SIZE) {
            throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh có kích thước nhỏ hơn 5MB.");
        }
    
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
