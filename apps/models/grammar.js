const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa schema cho Grammar
const grammarSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,  // Textarea dài để chứa nội dung với đường dẫn hình ảnh và video
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now  // Lưu ngày và thời gian hiện tại khi tạo mới
    },
    images: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Grammar = mongoose.model('Grammar', grammarSchema);

module.exports = Grammar;
