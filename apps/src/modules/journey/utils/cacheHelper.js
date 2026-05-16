const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');

async function invalidateJourneyCache() {
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
        const deletedList = await scanAndDelete('journey:list:*');
        const deletedAll = await scanAndDelete('journey:allWithDetails');
        const deletedDetail = await scanAndDelete('journey:details:*');
        const deletedApi = await scanAndDelete('cache:/api/journey*');
        const total = deletedList + deletedAll + deletedDetail + deletedApi;

        if(total > 0) {
            console.log(`Journey cache invalidated (${total} keys deleted)`);
        } else {
            console.log('No journey cache keys found to invalidate.');
        }
    } catch (err) {
        console.error('Invalidate journey cache error:', err);
    }
}

module.exports = { invalidateJourneyCache };