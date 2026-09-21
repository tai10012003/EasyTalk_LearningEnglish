const cache = require('./cacheService');
const cacheNs = require('./cacheNamespaces');

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

async function invalidateContentCache(module, label, options = {}) {
    const { id, slug, slugs = [], extraTags = [] } = options;
    const slugValues = unique([slug, ...slugs]);
    const scopedTags = [
        cacheNs.tag(module, 'list'),
        cacheNs.tag(module, 'all'),
        id ? cacheNs.tag(module, 'item', id) : cacheNs.tag(module, 'item'),
        ...slugValues.map(value => cacheNs.tag(module, 'slug', value)),
        ...extraTags
    ];
    if (slugValues.length === 0 && !id) {
        scopedTags.push(cacheNs.tag(module, 'slug'));
    }
    return await cache.invalidateTags(scopedTags, label);
}

module.exports = {
    invalidateContentCache
};
