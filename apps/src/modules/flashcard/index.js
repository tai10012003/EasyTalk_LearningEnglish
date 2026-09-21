const { createFlashcardController } = require('./controllers/flashcardController');
const FlashcardService = require('./services/flashcardService');
const FlashcardImageService = require('./services/flashcardImageService');

module.exports = {
    createFlashcardController,
    FlashcardService,
    FlashcardImageService
};
