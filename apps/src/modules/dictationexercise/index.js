const { createDictationExerciseController } = require('./controllers/dictationexerciseController');
const DictationExerciseService = require('./services/dictationexerciseService');
const DictationExerciseRepository = require('./repositories/dictationexerciseRepository');

module.exports = {
    createDictationExerciseController,
    DictationExerciseService,
    DictationExerciseRepository
};
