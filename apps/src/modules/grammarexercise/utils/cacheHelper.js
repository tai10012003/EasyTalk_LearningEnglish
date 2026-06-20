const cache = require('../../../shared/utils/cacheService');

async function invalidateGrammarExerciseCache() {
    return await cache.invalidatePatterns([
        'grammarexercise:list:*',
        'grammarexercise:item:*'
    ], 'Grammar Exercise');
}

module.exports = { invalidateGrammarExerciseCache };