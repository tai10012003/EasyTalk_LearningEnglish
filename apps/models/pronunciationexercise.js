const mongoose = require('mongoose');

// Schema cho câu hỏi phát âm
const pronunciationQuestionSchema = new mongoose.Schema({
    question: {
        type: String, // Câu hỏi hoặc đoạn văn cần đọc
        required: true
    },
    audioUrl: {
        type: String, // URL để phát âm thanh của từ hoặc câu
        required: false
    },
    type: {
        type: String,
        enum: ['multiple-choice', 'pronunciation'], // Các loại câu hỏi có thể có
        required: true
    },
    correctAnswer: {
        type: String, // Đáp án đúng
        required: true
    },
    options: {
        type: [String], // Dùng để lưu trữ các tùy chọn cho câu hỏi trắc nghiệm
        required: function() {
            return this.type === 'multiple-choice'; // Chỉ cần thiết khi loại là multiple-choice
        }
    },
    explanation: {
        type: String, // Giải thích
        required: true
    }
}, { _id: false });

const pronunciationExerciseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    questions: {
        type: [pronunciationQuestionSchema], // Sử dụng schema câu hỏi ở trên
        required: true
    }
}, { timestamps: true }); // Tự động thêm timestamp cho createdAt và updatedAt

const PronunciationExercise = mongoose.model('PronunciationExercise', pronunciationExerciseSchema);

module.exports = PronunciationExercise;
