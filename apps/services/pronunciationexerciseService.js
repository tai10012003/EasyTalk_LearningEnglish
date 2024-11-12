const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class PronunciationexerciseService {
    databaseConnection = require('./../database/database');
    client;
    pronunciationExercisesCollection;
    pronunciationExercisesDatabase;
    pronunciationexercises = require('./../models/pronunciationexercise');

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.pronunciationExercisesDatabase = this.client.db(config.mongodb.database);
        this.pronunciationExercisesCollection = this.pronunciationExercisesDatabase.collection("pronunciationexercises");
    }

    async getPronunciationexerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit;
            const cursor = await this.pronunciationExercisesCollection
                .find({})
                .skip(skip)
                .limit(limit);

            const pronunciationexercises = await cursor.toArray();
            const totalExercises = await this.pronunciationExercisesCollection.countDocuments();

            return { pronunciationexercises, totalExercises };
        } catch (error) {
            throw new Error("Error fetching pronunciation exercises");
        }
    }

    async getPronunciationexerciseById(id) {
        return await this.pronunciationExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertPronunciationexercise(exerciseData) {
        const newExercise = {
            title: exerciseData.title,
            questions: []
        };
        if (exerciseData.questions && Array.isArray(exerciseData.questions)) {
            exerciseData.questions.forEach(question => {
                newExercise.questions.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.pronunciationExercisesCollection.insertOne(newExercise);
    }

    async updatePronunciationexercise(id, updateData) {
        const objectId = new ObjectId(id);

        const formattedQuestions = updateData.questions.map((question) => {
            return {
                question: question.question,
                type: question.type,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || "",
                options: question.options || [],
            };
        });

        const update = {
            title: updateData.title.trim(),
            questions: formattedQuestions,
            updatedAt: new Date(),
        };

        const result = await this.pronunciationExercisesCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deletePronunciationexercise(id) {
        return await this.pronunciationExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PronunciationexerciseService;
