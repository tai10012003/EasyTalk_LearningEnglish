const mongoose = require("mongoose");


const flashcardSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
  },
  meaning: {
    type: String,
    required: true,
  },
  pos: {
    type: String,
    required: false,
  },
  pronunciation: {
    type: String,
    required: false,
  },
  exampleSentence: {
    type: String,
    required: false,
  },
  image: {
    type: String,  // Could store a URL or file path to the image
    required: false,
  },
  audio: {
    type: String,  // Could store a URL or file path to the audio file
    required: false,
  },
  flashcardList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashcardList',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

module.exports = Flashcard;
