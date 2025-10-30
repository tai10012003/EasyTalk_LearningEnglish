const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const DatabaseConnection = require('./../database/database');

class PronunciationexerciseRepository {
    client;
    db;
    pronunciationExercisesCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.pronunciationExercisesCollection = this.db.collection("pronunciationexercises");
    }

    async findPronunciationExercises(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.pronunciationExercisesCollection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const pronunciationexercises = await cursor.toArray();
        const totalExercises = await this.pronunciationExercisesCollection.countDocuments();
        return { pronunciationexercises, totalExercises };
    }

    async findPronunciationExerciseById(id) {
        return await this.pronunciationExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async findPronunciationExerciseBySlug(slug) {
        return await this.pronunciationExercisesCollection.findOne({ slug });
    }

    async insertPronunciationExercise(exerciseData) {
        const newExercise = {
            title: exerciseData.title,
            questions: Array.isArray(exerciseData.questions) ? exerciseData.questions.map(q => ({
                question: q.question,
                type: q.type,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || "",
                options: q.options || [],
            })) : [],
            slug: exerciseData.slug,
            sort: exerciseData.sort,
            display: exerciseData.display,
            createdAt: new Date()
        };
        return await this.pronunciationExercisesCollection.insertOne(newExercise);
    }

    async updatePronunciationExercise(id, updateData) {
        const objectId = new ObjectId(id);
        const formattedQuestions = Array.isArray(updateData.questions) ? updateData.questions.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || [],
        })) : [];

        const update = {
            title: updateData.title.trim(),
            questions: formattedQuestions,
            slug: updateData.slug,
            sort: updateData.sort,
            display: updateData.display,
            updatedAt: new Date(),
        };

        return await this.pronunciationExercisesCollection.updateOne({ _id: objectId }, { $set: update });
    }

    async deletePronunciationExercise(id) {
        return await this.pronunciationExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PronunciationexerciseRepository;