const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

async function invalidateStageCache() {
    return await cache.invalidateTags([
        cacheNs.tag('stage', 'list'),
        cacheNs.tag('stage', 'detail'),
        cacheNs.tag('stage', 'gate'),
        cacheNs.tag('stage', 'all'),
        ...cacheNs.dependencyTags('stage')
    ], 'Stage');
}

module.exports = { invalidateStageCache };
