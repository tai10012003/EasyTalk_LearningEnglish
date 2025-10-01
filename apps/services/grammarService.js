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
        const newGrammar = {
            title: grammar.title,
            description: grammar.description,
            content: grammar.content,
            images: grammar.images,
            quizzes: [],
            createdAt: new Date()
        };
        if (grammar.quizzes && Array.isArray(grammar.quizzes)) {
            grammar.quizzes.forEach(question => {
                newGrammar.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.grammarsCollection.insertOne(newGrammar);
    }

    async updateGrammar(id, grammar) {
        const objectId = new ObjectId(id);
        const formattedQuestions = grammar.quizzes.map((question) => {
            return {
                question: question.question,
                type: question.type,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || "",
                options: question.options || [],
            };
        });
        const update = {
            title: grammar.title.trim(),
            description: grammar.description.trim(),
            content: grammar.content.trim(),
            images: grammar.images.trim(),
            quizzes: formattedQuestions,
            updatedAt: new Date(),
        };
        const result = await this.grammarsCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deleteGrammar(id) {
        return await this.grammarsCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = GrammarsService;
