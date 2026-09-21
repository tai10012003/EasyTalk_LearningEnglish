const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidateStoryCache(options = {}) {
    return await invalidateContentCache('story', 'Story', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidateStoryCache };
