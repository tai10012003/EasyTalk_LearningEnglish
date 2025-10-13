const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Định nghĩa Schema cho Blog
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    // Bạn có thể thêm ngày tạo và ngày cập nhật tự động
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo model Blog từ schema
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
