const cache = require('../../../shared/utils/cacheService');

async function invalidatePronunciationExerciseCache() {
    return await cache.invalidatePatterns([
        'pronunciationexercise:list:*',
        'pronunciationexercise:item:*'
    ], 'Pronunciation Exercise');
}

module.exports = { invalidatePronunciationExerciseCache };