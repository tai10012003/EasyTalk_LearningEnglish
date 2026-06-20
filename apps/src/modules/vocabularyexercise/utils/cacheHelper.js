const cache = require('../../../shared/utils/cacheService');

async function invalidateVocabularyExerciseCache() {
    return await cache.invalidatePatterns([
        'vocabularyexercise:list:*',
        'vocabularyexercise:item:*'
    ], 'Vocabulary Exercise');
}

module.exports = { invalidateVocabularyExerciseCache };