const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');

async function invalidateGrammarCache() {
    const redis = getRedisClient();
    const scanAndDelete = async (pattern) => {
        let cursor = '0';
        let totalDeleted = 0;
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            if (keys.length > 0) {
                await redis.del(keys);
                totalDeleted += keys.length;
            }
            cursor = nextCursor;
        } while (cursor !== '0');
        return totalDeleted;
    };
    try {
        const deletedList = await scanAndDelete('grammar:list:*');
        const deletedItem = await scanAndDelete('grammar:item:*');
        const deletedApi = await scanAndDelete('cache:/api/grammar*');
        const total = deletedList + deletedItem + deletedApi;
        if (total > 0) {
            console.log(`Grammar cache invalidated (${total} keys deleted)`);
        } else {
            console.log('No grammar cache keys found to invalidate.');
        }
    } catch (err) {
        console.error('Invalidate grammar cache error:', err);
    }
}

module.exports = { invalidateGrammarCache };