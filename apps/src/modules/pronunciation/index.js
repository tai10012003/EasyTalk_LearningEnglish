const { createPronunciationController } = require('./controllers/pronunciationController');
const PronunciationService = require('./services/pronunciationService');
const PronunciationImageService = require('./services/pronunciationImageService');
const PronunciationRepository = require('./repositories/pronunciationRepository');

module.exports = {
    createPronunciationController,
    PronunciationService,
    PronunciationImageService,
    PronunciationRepository
};
