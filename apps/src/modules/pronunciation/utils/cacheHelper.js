const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidatePronunciationCache(options = {}) {
    return await invalidateContentCache('pronunciation', 'Pronunciation', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidatePronunciationCache };
