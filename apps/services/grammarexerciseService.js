const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class GrammarexerciseService {
    databaseConnection = require('./../database/database');
    grammarexercises = require('./../models/grammarexercise');
    client;
    grammarExercisesCollection;  
    grammarExercisesDatabase;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.grammarExercisesDatabase = this.client.db(config.mongodb.database);
        this.grammarExercisesCollection = this.grammarExercisesDatabase.collection("grammarexercises");
    }

    async getGrammarexerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit;
            const cursor = await this.grammarExercisesCollection.find({}).skip(skip).limit(limit);
            const grammarexercises = await cursor.toArray();
            const totalExercises = await this.grammarExercisesCollection.countDocuments(); 
    
            return { grammarexercises, totalExercises };
        } catch (error) {
            console.error("Error in getGrammarexerciseList:", error);
            throw new Error("Error fetching grammar exercises");
        }
    }
    
    async getGrammarexerciseById(id) {
        return await this.grammarExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertGrammarexercise(exerciseData) {
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
        return await this.grammarExercisesCollection.insertOne(newExercise);
    }

    async updateGrammarexercise(id, updateData) {
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

        const result = await this.grammarExercisesCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    async deleteGrammarexercise(id) {
        return await this.grammarExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = GrammarexerciseService;
