const cache = require('../../../shared/utils/cacheService');

async function invalidateGateCache() {
    return await cache.invalidatePatterns([
        'gate:list:*',
        'gate:item:*',
        'gate:journey:*'
    ], 'Gate');
}

module.exports = { invalidateGateCache };