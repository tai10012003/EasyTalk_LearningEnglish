const cache = require('../../../shared/utils/cacheService');

async function invalidateUserProgressCache() {
    return await cache.invalidatePatterns([
        'userprogress:list:*'
    ], 'User Progress');
}

module.exports = { invalidateUserProgressCache };