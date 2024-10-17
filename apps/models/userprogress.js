// models/UserProgress.js
const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unlockedGates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Gate' }],
    unlockedStages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stage' }]
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
