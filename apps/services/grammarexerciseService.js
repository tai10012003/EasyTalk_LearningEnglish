const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class GrammarexerciseService {
    databaseConnection = require('./../database/database');
    grammarexercises = require('./../models/grammarexercise'); // Import model đã tạo
    client;
    grammarExercisesCollection;  
    grammarExercisesDatabase;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.grammarExercisesDatabase = this.client.db(config.mongodb.database);
        this.grammarExercisesCollection = this.grammarExercisesDatabase.collection("grammarexercises"); // Tên bảng grammar exercises
    }

    async getGrammarexerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit; // Tính số lượng bài tập cần bỏ qua cho phân trang
            const cursor = await this.grammarExercisesCollection.find({}).skip(skip).limit(limit);
            const grammarexercises = await cursor.toArray(); // Chuyển cursor thành mảng
            const totalExercises = await this.grammarExercisesCollection.countDocuments(); // Đếm tổng số bài tập
    
            return { grammarexercises, totalExercises }; // Trả về dữ liệu
        } catch (error) {
            console.error("Error in getGrammarexerciseList:", error); // Ghi lỗi vào console
            throw new Error("Error fetching grammar exercises");
        }
    }
    


    // Lấy một bài tập ngữ pháp theo ID
    async getGrammarexerciseById(id) {
        return await this.grammarExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    // Thêm bài tập ngữ pháp mới
    async insertGrammarexercise(exerciseData) {
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
        return await this.grammarExercisesCollection.insertOne(newExercise);
    }

    async updateGrammarexercise(id, updateData) {
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

        const result = await this.grammarExercisesCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    // Xóa bài tập ngữ pháp
    async deleteGrammarexercise(id) {
        return await this.grammarExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = GrammarexerciseService;
