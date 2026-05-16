const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');

async function invalidateStoryCache() {
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
        } while(cursor !== '0');
        return totalDeleted;
    };
    try {
        const deletedList = await scanAndDelete('story:list:*');
        const deletedItem = await scanAndDelete('story:item:*');
        const deletedApi = await scanAndDelete('cache:/api/story*');
        const total = deletedList + deletedItem + deletedApi;
        if(total > 0) {
            console.log(`Story cache invalidated (${total} keys deleted)`);
        } else {
            console.log('No story cache keys found to invalidate.');
        }
    } catch (err) {
        console.error('Invalidate story cache error:', err);
    }
}

module.exports = { invalidateStoryCache };