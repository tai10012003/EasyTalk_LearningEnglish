const { createGrammarExerciseController } = require('./controllers/grammarexerciseController');
const GrammarExerciseService = require('./services/grammarexerciseService');
const GrammarExerciseRepository = require('./repositories/grammarexerciseRepository');
const GrammarExerciseAttemptRepository = require('./repositories/grammarexerciseAttemptRepository');

module.exports = {
    createGrammarExerciseController,
    GrammarExerciseService,
    GrammarExerciseRepository,
    GrammarExerciseAttemptRepository
};
