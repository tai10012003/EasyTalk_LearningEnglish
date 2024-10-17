const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gateSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    stages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stage'
    }],
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Journey',
        required: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Gate = mongoose.model('Gate', gateSchema);
module.exports = Gate;
