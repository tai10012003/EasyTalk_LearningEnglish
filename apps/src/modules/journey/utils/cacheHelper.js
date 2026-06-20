const cache = require('../../../shared/utils/cacheService');

async function invalidateJourneyCache() {
    return await cache.invalidatePatterns([
        'journey:list:*',
        'journey:allWithDetails',
        'journey:details:*'
    ], 'Journey');
}

module.exports = { invalidateJourneyCache };