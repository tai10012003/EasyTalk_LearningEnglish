const { createPronunciationExerciseController } = require('./controllers/pronunciationexerciseController');
const PronunciationExerciseService = require('./services/pronunciationexerciseService');
const SpeechAnalysisService = require('./services/speechAnalysisService');
const PronunciationExerciseRepository = require('./repositories/pronunciationexerciseRepository');
const PronunciationExerciseAttemptRepository = require('./repositories/pronunciationexerciseAttemptRepository');

module.exports = {
    createPronunciationExerciseController,
    PronunciationExerciseService,
    SpeechAnalysisService,
    PronunciationExerciseRepository,
    PronunciationExerciseAttemptRepository
};
