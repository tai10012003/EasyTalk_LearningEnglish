const cache = require('../../../shared/utils/cacheService');

async function invalidateGrammarCache() {
    return await cache.invalidatePatterns([
        'grammar:list:*',
        'grammar:item:*'
    ], 'Grammar');
}

module.exports = { invalidateGrammarCache };