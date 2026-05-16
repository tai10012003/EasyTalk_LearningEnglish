const { getSafeRedisClient: getRedisClient } = require('../../../shared/utils/redisClient');

async function invalidateFlashcardCache() {
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
        const deletedList = await scanAndDelete('flashcard:list:*');
        const deletedItem = await scanAndDelete('flashcard:listById:*');
        const deletedApi = await scanAndDelete('cache:/api/flashcard*');
        const total = deletedList + deletedItem + deletedApi;
        if(total > 0) {
            console.log(`Flashcard cache invalidated (${total} keys deleted)`);
        } else {
            console.log('No flashcard cache keys found to invalidate.');
        }
    } catch (err) {
        console.error('Invalidate flashcard cache error:', err);
    }
}

module.exports = { invalidateFlashcardCache };