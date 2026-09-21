const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

async function invalidateJourneyCache() {
    return await cache.invalidateTags([
        cacheNs.tag('journey', 'list'),
        cacheNs.tag('journey', 'details'),
        cacheNs.tag('journey', 'all'),
        cacheNs.tag('userprogress', 'detail')
    ], 'Journey');
}

module.exports = { invalidateJourneyCache };
