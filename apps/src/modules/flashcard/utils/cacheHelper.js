const cache = require('../../../shared/utils/cacheService');

async function invalidateFlashcardCache() {
    return await cache.invalidatePatterns([
        'flashcard:list:*',
        'flashcard:listById:*'
    ], 'Flashcard');
}

module.exports = { invalidateFlashcardCache };