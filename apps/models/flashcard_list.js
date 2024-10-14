const mongoose = require('mongoose');

const flashcardListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxLength: 100,
  },
  description: {
    type: String,
    required: false,
    maxLength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const FlashcardList = mongoose.model('FlashcardList', flashcardListSchema);

module.exports = FlashcardList;
