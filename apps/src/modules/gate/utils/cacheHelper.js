const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

async function invalidateGateCache() {
    return await cache.invalidateTags([
        cacheNs.tag('gate', 'list'),
        cacheNs.tag('gate', 'item'),
        cacheNs.tag('gate', 'journey'),
        cacheNs.tag('gate', 'all'),
        ...cacheNs.dependencyTags('gate')
    ], 'Gate');
}

module.exports = { invalidateGateCache };
