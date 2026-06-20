const { isRedisConnected } = require('../../shared/utils/redisClient');
const cache = require('../utils/cacheService');

const normalizeCacheOptions = (options = {}) => {
    if (typeof options === 'number') {
        return { ttl: options, keyPrefix: 'cache:', enabled: true };
    }
    return {
        ttl: options.ttl || 300,
        keyPrefix: options.keyPrefix || 'cache:',
        enabled: options.enabled !== false,
        keyGenerator: options.keyGenerator
    };
};

const cacheMiddleware = (options = {}) => {
    const { ttl, keyPrefix, enabled, keyGenerator } = normalizeCacheOptions(options);
    return async (req, res, next) => {
        if (!enabled) return next();
        if (req.method !== 'GET') return next();
        try {
            if (!isRedisConnected()) {
                console.warn('Redis not connected, skipping cache');
                return next();
            }
            const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : `${keyPrefix}${req.originalUrl || req.url}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData !== undefined) {
                return res.json(cachedData);
            }
            console.log(`Cache MISS: ${cacheKey}`);
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                if (res.statusCode < 400) {
                    cache.set(cacheKey, ttl, data).catch(err => console.error('Cache set error:', err));
                }
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
    return await cache.invalidatePatterns([pattern], pattern);
};

const clearCacheByKey = async (key) => {
    try {
        const deleted = await cache.delete(key);
        console.log(`Cache cleared: ${key}`);
        return deleted > 0;
    } catch (error) {
        console.error('Cache clear error:', error);
        return false;
    }
};

const cacheResponse = (keyGenerator, ttl = 300) => {
    return async (req, res, next) => {
        try {
            if (!isRedisConnected()) return next();
            const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
            const cachedData = await cache.get(cacheKey);
            if (cachedData !== undefined) {
                return res.json(cachedData);
            }
            console.log(`Cache MISS: ${cacheKey}`);
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                if (res.statusCode < 400) {
                    cache.set(cacheKey, ttl, data).catch(err => console.error('Cache set error:', err));
                }
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