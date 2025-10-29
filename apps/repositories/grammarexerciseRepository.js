const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const DatabaseConnection = require('./../database/database');

class GrammarexerciseRepository {
    client;
    db;
    grammarExercisesCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.grammarExercisesCollection = this.db.collection("grammarexercises");
    }

    async findGrammarExercises(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const cursor = await this.grammarExercisesCollection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const grammarexercises = await cursor.toArray();
        const totalExercises = await this.grammarExercisesCollection.countDocuments();
        return { grammarexercises, totalExercises };
    }

    async findGrammarExerciseById(id) {
        return await this.grammarExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async findGrammarExerciseBySlug(slug) {
        return await this.grammarExercisesCollection.findOne({ slug });
    }

    async insertGrammarExercise(exerciseData) {
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
        return await this.grammarExercisesCollection.insertOne(newExercise);
    }

    async updateGrammarExercise(id, updateData) {
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

        return await this.grammarExercisesCollection.updateOne({ _id: objectId }, { $set: update });
    }

    async deleteGrammarExercise(id) {
        return await this.grammarExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = GrammarexerciseRepository;