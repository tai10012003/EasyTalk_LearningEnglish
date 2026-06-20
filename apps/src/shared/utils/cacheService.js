const { getSafeRedisClient } = require('./redisClient');

class CacheService {
    constructor(redis = getSafeRedisClient()) {
        this.redis = redis;
    }

    async get(key) {
        const cached = await this.redis.get(key);
        if (cached === null || cached === undefined) return undefined;
        try {
            console.log(`Cache hit: ${key}`);
            return JSON.parse(cached);
        } catch (err) {
            console.warn(`Cache parse error for "${key}": ${err.message}`);
            return null;
        }
    }

    async set(key, ttl, value) {
        if (value === undefined) return;
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
            console.log(`Cache set: ${key}`);
        } catch (err) {
            console.warn(`Cache set error for "${key}": ${err.message}`);
        }
    }

    async delete(...keys) {
        if (!keys.length) return 0;
        return await this.redis.del(...keys);
    }

    async scanAndDelete(pattern) {
        let cursor = '0';
        let totalDeleted = 0;
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            if (keys.length > 0) {
                totalDeleted += await this.delete(...keys);
            }
            cursor = nextCursor;
        } while (cursor !== '0');
        return totalDeleted;
    }

    async invalidatePatterns(patterns, label = 'Cache') {
        try {
            let total = 0;
            for (const pattern of patterns) {
                total += await this.scanAndDelete(pattern);
            }
            if (total > 0) {
                console.log(`${label} cache invalidated (${total} keys deleted)`);
            } else {
                console.log(`No ${label.toLowerCase()} cache keys found to invalidate.`);
            }
            return total;
        } catch (err) {
            console.error(`Invalidate ${label.toLowerCase()} cache error:`, err);
            return 0;
        }
    }

    async getOrSet(key, ttl, fetchFn) {
        const cached = await this.get(key);
        if (cached !== undefined) return cached;
        const value = await fetchFn();
        await this.set(key, ttl, value);
        return value;
    }
}

module.exports = new CacheService();
module.exports.CacheService = CacheService;