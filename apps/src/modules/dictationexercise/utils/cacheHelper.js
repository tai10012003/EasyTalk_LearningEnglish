const cache = require('../../../shared/utils/cacheService');

async function invalidateDictationExerciseCache() {
    return await cache.invalidatePatterns([
        'dictation:list:*',
        'dictation:item:*'
    ], 'Dictation Exercise');
}

module.exports = { invalidateDictationExerciseCache };