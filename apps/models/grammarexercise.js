const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['multiple-choice', 'fill-in-the-blank', 'translation'], // Các loại câu hỏi có thể có
        required: true
    },
    options: {
        type: [String], // Dùng để lưu trữ các tùy chọn cho câu hỏi trắc nghiệm
        required: function() {
            return this.type === 'multiple-choice'; // Chỉ cần thiết khi loại là multiple-choice
        }
    },
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    }
}, { _id: false });

const grammarExerciseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    questions: {
        type: [questionSchema], // Sử dụng schema câu hỏi ở trên
        required: true
    }
}, { timestamps: true }); // Tự động thêm timestamp cho createdAt và updatedAt

const GrammarExercise = mongoose.model('GrammarExercise', grammarExerciseSchema);

module.exports = GrammarExercise;
