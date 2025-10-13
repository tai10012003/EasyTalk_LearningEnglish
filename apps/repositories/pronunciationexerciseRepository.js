const { ObjectId } = require('mongodb');
const config = require('./../config/setting.json');
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

    async findPronunciationExercises(page = 1, limit = 5) {
        const skip = (page - 1) * limit;
        const cursor = await this.pronunciationExercisesCollection.find({}).skip(skip).limit(limit);
        const pronunciationexercises = await cursor.toArray();
        const totalExercises = await this.pronunciationExercisesCollection.countDocuments();
        return { pronunciationexercises, totalExercises };
    }

    async findPronunciationExerciseById(id) {
        return await this.pronunciationExercisesCollection.findOne({ _id: new ObjectId(id) });
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
            updatedAt: new Date(),
        };

        return await this.pronunciationExercisesCollection.updateOne({ _id: objectId }, { $set: update });
    }

    async deletePronunciationExercise(id) {
        return await this.pronunciationExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PronunciationexerciseRepository;