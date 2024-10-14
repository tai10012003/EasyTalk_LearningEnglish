const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho câu hỏi trong bài tập
const questionSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['multiple-choice', 'fill-in-the-blank', 'translation'], // Các loại câu hỏi
        required: true
    },
    options: {
        type: [String],  // Các tùy chọn cho câu hỏi trắc nghiệm
        required: function() {
            return this.type === 'multiple-choice';  // Chỉ cần thiết khi loại là multiple-choice
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

// Schema chính cho Exercise Stage
const stageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    gate: {
        type: Schema.Types.ObjectId,
        ref: 'Gate',  // Tham chiếu tới gate
        required: true
    },
    questions: {
        type: [questionSchema],  // Danh sách câu hỏi
        required: true
    }
}, { timestamps: true });  // Tự động thêm createdAt và updatedAt

// Model Stage
const Stage = mongoose.model('Stage', stageSchema);
module.exports = Stage;
