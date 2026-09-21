const { createVocabularyExerciseController } = require('./controllers/vocabularyexerciseController');
const VocabularyExerciseService = require('./services/vocabularyexerciseService');
const VocabularyExerciseRepository = require('./repositories/vocabularyexerciseRepository');
const VocabularyExerciseAttemptRepository = require('./repositories/vocabularyexerciseAttemptRepository');

module.exports = {
    createVocabularyExerciseController,
    VocabularyExerciseService,
    VocabularyExerciseRepository,
    VocabularyExerciseAttemptRepository
};
