const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

async function invalidateFlashcardCache() {
    return await cache.invalidateTags([
        cacheNs.tag('flashcard', 'list'),
        cacheNs.tag('flashcard', 'item'),
        cacheNs.tag('flashcard', 'all')
    ], 'Flashcard');
}

module.exports = { invalidateFlashcardCache };
