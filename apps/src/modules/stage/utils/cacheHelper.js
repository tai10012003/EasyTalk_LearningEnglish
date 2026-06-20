const cache = require('../../../shared/utils/cacheService');

async function invalidateStageCache() {
    return await cache.invalidatePatterns([
        'stage:list:*',
        'stage:detail:*'
    ], 'Stage');
}

module.exports = { invalidateStageCache };