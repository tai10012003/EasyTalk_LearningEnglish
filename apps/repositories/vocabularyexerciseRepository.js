const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const DatabaseConnection = require('./../database/database');

class VocabularyexerciseRepository {
    client;
    db;
    vocabularyExercisesCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.vocabularyExercisesCollection = this.db.collection("vocabularyexercises");
    }

    async findVocabularyExercises(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.vocabularyExercisesCollection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const vocabularyExercises = await cursor.toArray();
        const totalExercises = await this.vocabularyExercisesCollection.countDocuments();
        return { vocabularyExercises, totalExercises };
    }

    async findVocabularyExerciseById(id) {
        return await this.vocabularyExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async findVocabularyExerciseBySlug(slug) {
        return await this.vocabularyExercisesCollection.findOne({ slug });
    }

    async insertVocabularyExercise(exerciseData) {
        const newExercise = {
            title: exerciseData.title,
            questions: Array.isArray(exerciseData.questions)
                ? exerciseData.questions.map(q => ({
                    question: q.question,
                    type: q.type,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || "",
                    options: q.options || [],
                }))
                : [],
            slug: exerciseData.slug,
            sort: exerciseData.sort,
            display: exerciseData.display,
            createdAt: new Date()
        };
        return await this.vocabularyExercisesCollection.insertOne(newExercise);
    }

    async updateVocabularyExercise(id, updateData) {
        const objectId = new ObjectId(id);
        const formattedQuestions = Array.isArray(updateData.questions)
            ? updateData.questions.map(q => ({
                question: q.question,
                type: q.type,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || "",
                options: q.options || [],
            }))
            : [];

        const update = {
            title: updateData.title.trim(),
            questions: formattedQuestions,
            slug: updateData.slug,
            sort: updateData.sort,
            display: updateData.display,
            updatedAt: new Date(),
        };

        return await this.vocabularyExercisesCollection.updateOne({ _id: objectId }, { $set: update });
    }

    async deleteVocabularyExercise(id) {
        return await this.vocabularyExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = VocabularyexerciseRepository;