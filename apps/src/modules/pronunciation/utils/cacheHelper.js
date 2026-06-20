const cache = require('../../../shared/utils/cacheService');

async function invalidatePronunciationCache() {
    return await cache.invalidatePatterns([
        'pronunciation:list:*',
        'pronunciation:item:*'
    ], 'Pronunciation');
}

module.exports = { invalidatePronunciationCache };