const { createGrammarController } = require('./controllers/grammarController');
const GrammarService = require('./services/grammarService');
const GrammarImageService = require('./services/grammarImageService');
const GrammarRepository = require('./repositories/grammarRepository');

module.exports = {
    createGrammarController,
    GrammarService,
    GrammarImageService,
    GrammarRepository
};
