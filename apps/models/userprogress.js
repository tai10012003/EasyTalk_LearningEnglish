// models/UserProgress.js
const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unlockedGates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gate' }],
    unlockedStages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }],
    experiencePoints: {
        type: Number,
        default: 0 // Bắt đầu với 0 điểm KN cho mỗi người dùng mới
    },
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
