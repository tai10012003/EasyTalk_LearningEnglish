const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const journeySchema = new Schema({
    title: {
        type: String,
        required: true
    },
    gates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gate'
    }]
}, { timestamps: true });

const Journey = mongoose.model('Journey', journeySchema);
module.exports = Journey;
