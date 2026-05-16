const { getRedisClient, isRedisConnected } = require('../../shared/utils/redisClient');

const cacheMiddleware = (options = {}) => {
    const { ttl = 300, keyPrefix = 'cache:', enabled = true } = options;
    return async (req, res, next) => {
        if (!enabled) return next();
        if (req.method !== 'GET') return next();
        try {
            if (!isRedisConnected()) {
                console.warn('Redis not connected, skipping cache');
                return next();
            }
            const redis = getRedisClient();
            const cacheKey = `${keyPrefix}${req.originalUrl || req.url}`;
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.json(JSON.parse(cachedData));
            }
            console.log(`Cache MISS: ${cacheKey}`);
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                redis.setex(cacheKey, ttl, JSON.stringify(data))
                    .then(() => console.log(`Cached: ${cacheKey} (TTL: ${ttl}s)`))
                    .catch(err => console.error('Cache set error:', err));
                return originalJson(data);
            };
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

const invalidateCache = async (pattern) => {
    try {
        if (!isRedisConnected()) {
            console.warn('Redis not connected, cannot invalidate cache');
            return 0;
        }
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Cache invalidated: ${pattern} (${keys.length} keys deleted)`);
            return keys.length;
        }
        return 0;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
};

const clearCacheByKey = async (key) => {
    try {
        if (!isRedisConnected()) {
            console.warn('Redis not connected, cannot clear cache');
            return false;
        }
        await getRedisClient().del(key);
        console.log(`Cache cleared: ${key}`);
        return true;
    } catch (error) {
        console.error('Cache clear error:', error);
        return false;
    }
};

const cacheResponse = (keyGenerator, ttl = 300) => {
    return async (req, res, next) => {
        try {
            if (!isRedisConnected()) return next();
            const redis = getRedisClient();
            const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.json(JSON.parse(cachedData));
            }
            console.log(`Cache MISS: ${cacheKey}`);
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                redis.setex(cacheKey, ttl, JSON.stringify(data))
                    .then(() => console.log(`Cached: ${cacheKey} (TTL: ${ttl}s)`))
                    .catch(err => console.error('Cache set error:', err));
                return originalJson(data);
            };
            next();
        } catch (error) {
            console.error('Cache response middleware error:', error);
            next();
        }
    };
};

module.exports = cacheMiddleware;
module.exports.cacheMiddleware = cacheMiddleware;
module.exports.invalidateCache = invalidateCache;
module.exports.clearCacheByKey = clearCacheByKey;
module.exports.cacheResponse = cacheResponse;