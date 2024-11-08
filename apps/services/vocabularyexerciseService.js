const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class VocabularyExerciseService {
    databaseConnection = require('./../database/database');
    vocabularyexercises = require('./../models/vocabularyexercise'); // Import model đã tạo
    client;
    vocabularyExercisesCollection;  
    vocabularyExercisesDatabase;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.vocabularyExercisesDatabase = this.client.db(config.mongodb.database);
        this.vocabularyExercisesCollection = this.vocabularyExercisesDatabase.collection("vocabularyexercises"); // Tên bảng vocabulary exercises
    }

    async getVocabularyExerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit; // Tính số lượng bài tập cần bỏ qua cho phân trang
            const cursor = await this.vocabularyExercisesCollection.find({}).skip(skip).limit(limit);
            const vocabularyExercises = await cursor.toArray(); // Chuyển cursor thành mảng
            const totalExercises = await this.vocabularyExercisesCollection.countDocuments(); // Đếm tổng số bài tập
    
            return { vocabularyExercises, totalExercises }; // Trả về dữ liệu
        } catch (error) {
            console.error("Error in getVocabularyExerciseList:", error); // Ghi lỗi vào console
            throw new Error("Error fetching vocabulary exercises");
        }
    }

    // Lấy một bài tập từ vựng theo ID
    async getVocabularyExerciseById(id) {
        return await this.vocabularyExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    // Thêm bài tập từ vựng mới
    async insertVocabularyExercise(exerciseData) {
        const newExercise = {
            title: exerciseData.title,
            questions: []
        };

        // Duyệt qua từng câu hỏi và thêm vào bài tập
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

        // Lưu bài tập mới vào cơ sở dữ liệu
        return await this.vocabularyExercisesCollection.insertOne(newExercise);
    }

    async updateVocabularyExercise(id, updateData) {
        const objectId = new ObjectId(id); // Chuyển đổi id sang ObjectId

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

    // Xóa bài tập từ vựng
    async deleteVocabularyExercise(id) {
        return await this.vocabularyExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = VocabularyExerciseService;
