const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');

async function invalidateGateCache() {
    const redis = getRedisClient();
    const scanAndDelete = async (pattern) => {
        let cursor = '0';
        let totalDeleted = 0;
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            if(keys.length > 0) {
                const deleted = await redis.del(keys);
                totalDeleted += deleted;
            }
            cursor = nextCursor;
        } while (cursor !== '0');
        return totalDeleted;
    };
    try {
        const deletedList = await scanAndDelete('gate:list:*');
        const deletedApi = await scanAndDelete('cache:/api/gate*');
        const total = deletedList + deletedApi;
        if(total > 0) {
            console.log(`Gate cache invalidated (${total} keys deleted)`);
        } else {
            console.log('No gate cache keys found to invalidate.');
        }
    } catch (err) {
        console.error('Invalidate gate cache error:', err);
    }
}

module.exports = { invalidateGateCache };