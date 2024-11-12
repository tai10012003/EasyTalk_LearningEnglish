const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class VocabularyExerciseService {
    databaseConnection = require('./../database/database');
    vocabularyexercises = require('./../models/vocabularyexercise');
    client;
    vocabularyExercisesCollection;  
    vocabularyExercisesDatabase;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.vocabularyExercisesDatabase = this.client.db(config.mongodb.database);
        this.vocabularyExercisesCollection = this.vocabularyExercisesDatabase.collection("vocabularyexercises");
    }

    async getVocabularyExerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit;
            const cursor = await this.vocabularyExercisesCollection.find({}).skip(skip).limit(limit);
            const vocabularyExercises = await cursor.toArray();
            const totalExercises = await this.vocabularyExercisesCollection.countDocuments();
    
            return { vocabularyExercises, totalExercises };
        } catch (error) {
            console.error("Error in getVocabularyExerciseList:", error);
            throw new Error("Error fetching vocabulary exercises");
        }
    }

    async getVocabularyExerciseById(id) {
        return await this.vocabularyExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertVocabularyExercise(exerciseData) {
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
        return await this.vocabularyExercisesCollection.insertOne(newExercise);
    }

    async updateVocabularyExercise(id, updateData) {
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

        const result = await this.vocabularyExercisesCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deleteVocabularyExercise(id) {
        return await this.vocabularyExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = VocabularyExerciseService;
