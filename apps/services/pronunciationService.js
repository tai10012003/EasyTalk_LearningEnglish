const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");
const fs = require("fs");
const path = require("path");

class PronunciationsService {
    databaseConnection = require('./../database/database');
    pronunciations = require('./../models/pronunciation');

    client;
    pronunciationsDatabase;
    pronunciationsCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.pronunciationsDatabase = this.client.db(config.mongodb.database);
        this.pronunciationsCollection = this.pronunciationsDatabase.collection("pronunciations");
        this.imageFolder = path.join(__dirname, "../public/images/pronunciation");
        if (!fs.existsSync(this.imageFolder)) fs.mkdirSync(this.imageFolder, { recursive: true });
    }
    async getPronunciationList(page = 1, limit = 3) {
        const skip = (page - 1) * limit; 
        const cursor = await this.pronunciationsCollection
            .find({}, {})
            .skip(skip)
            .limit(limit);

        const pronunciations = await cursor.toArray(); 
        const totalPronunciations = await this.pronunciationsCollection.countDocuments();

        return {
            pronunciations,     
            totalPronunciations, 
        };
    }

    async getPronunciation(id) {
        return await this.pronunciationsCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertPronunciation(pronunciation) {
        const newPronunciation = {
            title: pronunciation.title,
            description: pronunciation.description,
            content: pronunciation.content,
            images: pronunciation.images,
            quizzes: [],
            createdAt: new Date()
        };
        if (pronunciation.quizzes && Array.isArray(pronunciation.quizzes)) {
            pronunciation.quizzes.forEach(question => {
                newPronunciation.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.pronunciationsCollection.insertOne(newPronunciation);
    }

    async updatePronunciation(id, pronunciation) {
        const objectId = new ObjectId(id);
        const formattedQuestions = pronunciation.quizzes.map((question) => {
            return {
                question: question.question,
                type: question.type,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || "",
                options: question.options || [],
            };
        });
        const update = {
            title: pronunciation.title.trim(),
            description: pronunciation.description.trim(),
            content: pronunciation.content.trim(),
            images: pronunciation.images.trim(),
            quizzes: formattedQuestions,
            updatedAt: new Date(),
        };
        const result = await this.pronunciationsCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deletePronunciation(id) {
        return await this.pronunciationsCollection.deleteOne({ "_id": new ObjectId(id) });
    }

    getNextImageFilename(ext) {
        const files = fs.readdirSync(this.imageFolder)
            .filter(f => f.startsWith("pronunciation-"));
        const numbers = files
            .map(f => parseInt(f.match(/^pronunciation-(\d+)\./)?.[1]))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        let nextNumber = 1;
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] !== i + 1) {
                nextNumber = i + 1;
                break;
            }
            nextNumber = numbers.length + 1;
        }
        return `pronunciation-${nextNumber}${ext}`;
    }
}

module.exports = PronunciationsService;
