const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidateGrammarCache(options = {}) {
    return await invalidateContentCache('grammar', 'Grammar', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidateGrammarCache };
