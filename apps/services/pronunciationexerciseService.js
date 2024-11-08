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
        this.pronunciationExercisesCollection = this.pronunciationExercisesDatabase.collection("pronunciationexercises"); // Tên bảng bài tập phát âm
    }

    // Lấy danh sách bài tập phát âm với phân trang
    async getPronunciationexerciseList(page = 1, limit = 2) {
        try {
            const skip = (page - 1) * limit; // Tính số lượng bài tập cần bỏ qua
            const cursor = await this.pronunciationExercisesCollection
                .find({})
                .skip(skip)
                .limit(limit); // Thêm phân trang bằng cách dùng skip và limit

            const pronunciationexercises = await cursor.toArray(); // Chuyển cursor thành mảng
            const totalExercises = await this.pronunciationExercisesCollection.countDocuments(); // Đếm tổng số bài tập

            return { pronunciationexercises, totalExercises };
        } catch (error) {
            throw new Error("Error fetching pronunciation exercises");
        }
    }


    // Lấy một bài tập phát âm theo ID
    async getPronunciationexerciseById(id) {
        return await this.pronunciationExercisesCollection.findOne({ _id: new ObjectId(id) });
    }

    // Thêm bài tập phát âm mới
    async insertPronunciationexercise(exerciseData) {
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
                    options: question.options || [] // Chỉ cần thiết khi loại là 'multiple-choice'
                });
            });
        }

        // Lưu bài tập mới vào cơ sở dữ liệu
        return await this.pronunciationExercisesCollection.insertOne(newExercise);
    }

    // Cập nhật bài tập phát âm
    async updatePronunciationexercise(id, updateData) {
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

        const result = await this.pronunciationExercisesCollection.updateOne({ _id: objectId }, { $set: update });
        return result.modifiedCount > 0;
    }

    // Xóa bài tập phát âm
    async deletePronunciationexercise(id) {
        return await this.pronunciationExercisesCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = PronunciationexerciseService;
