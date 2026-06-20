const cache = require('../../../shared/utils/cacheService');

async function invalidateStoryCache() {
    return await cache.invalidatePatterns([
        'story:list:*',
        'story:item:*'
    ], 'Story');
}

module.exports = { invalidateStoryCache };