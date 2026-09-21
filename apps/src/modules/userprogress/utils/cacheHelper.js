const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

async function invalidateUserProgressCache(userId = null) {
    const tags = [
        cacheNs.tag('userprogress', 'list'),
        cacheNs.tag('userprogress', 'all')
    ];
    if (userId) {
        tags.push(cacheNs.tag('userprogress', 'detail', userId));
    } else {
        tags.push(cacheNs.tag('userprogress', 'detail'));
    }
    return await cache.invalidateTags(tags, 'User Progress');
}

async function invalidateUserProgressCaches(userIds = []) {
    const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(id => id.toString()))];
    let total = 0;
    for (const userId of uniqueUserIds) {
        total += await invalidateUserProgressCache(userId);
    }
    if (uniqueUserIds.length === 0) {
        total += await invalidateUserProgressCache();
    }
    return total;
}

module.exports = { invalidateUserProgressCache, invalidateUserProgressCaches };
