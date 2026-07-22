const { isRedisConnected } = require('../../shared/utils/redisClient');
const cache = require('../utils/cacheService');
const { buildCacheKey } = require('../utils/cacheKeyBuilder');
const logger = require('../utils/logger');
const metrics = require('../utils/cacheMetrics');

// Prefer service-layer cache for domain data; keep this middleware for simple public GET responses.
const normalizeCacheOptions = (options = {}) => {
    if (typeof options === 'number') {
        return { ttl: options, keyPrefix: 'cache:', enabled: true };
    }
    return {
        ttl: options.ttl || 300,
        keyPrefix: options.keyPrefix || 'cache:',
        enabled: options.enabled !== false,
        keyGenerator: options.keyGenerator,
        cacheAuthenticated: options.cacheAuthenticated === true,
        tags: options.tags || []
    };
};

const cacheMiddleware = (options = {}) => {
    const { ttl, keyPrefix, enabled, keyGenerator, cacheAuthenticated, tags } = normalizeCacheOptions(options);
    return async (req, res, next) => {
        if (!enabled) return next();
        if (req.method !== 'GET') return next();
        if (req.user && !cacheAuthenticated) {
            metrics.increment('cache.middleware.authenticated_skipped');
            return next();
        }
        try {
            if (!isRedisConnected()) {
                logger.debug('Redis not connected, skipping middleware cache');
                return next();
            }
            const cacheKey = typeof keyGenerator === 'function'
                ? keyGenerator(req)
                : buildCacheKey({
                    module: keyPrefix.replace(/:$/, '') || 'http',
                    resource: 'response',
                    query: {
                        method: req.method,
                        path: req.path || req.route?.path || req.url,
                        query: req.query,
                        role: req.user?.role,
                        userId: req.user?.id,
                        locale: req.headers['accept-language']
                    }
                });
            const cachedData = await cache.get(cacheKey);
            if (cachedData !== undefined) {
                return res.json(cachedData);
            }
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                if (res.statusCode < 400) {
                    cache.set(cacheKey, ttl, data, { tags }).catch(err => logger.error('Cache set error', { message: err.message }));
                }
                return originalJson(data);
            };
            next();
        } catch (error) {
            logger.error('Cache middleware error', { message: error.message });
            next();
        }
    };
};

const invalidateCache = async (tagOrTags) => {
    const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags];
    return await cache.invalidateTags(tags, 'HTTP Cache');
};

const clearCacheByKey = async (key) => {
    try {
        const deleted = await cache.delete(key);
        logger.info('Cache cleared by key', { key, deleted });
        return deleted > 0;
    } catch (error) {
        logger.error('Cache clear error', { message: error.message });
        return false;
    }
};

const cacheResponse = (keyGenerator, ttl = 300) => {
    return async (req, res, next) => {
        try {
            if (!isRedisConnected()) return next();
            const cacheKey = typeof keyGenerator === 'function'
                ? keyGenerator(req)
                : buildCacheKey({ module: 'http', resource: 'response', query: { key: keyGenerator } });
            const cachedData = await cache.get(cacheKey);
            if (cachedData !== undefined) {
                return res.json(cachedData);
            }
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                res.json = originalJson;
                if (res.statusCode < 400) {
                    cache.set(cacheKey, ttl, data).catch(err => logger.error('Cache set error', { message: err.message }));
                }
                return originalJson(data);
            };
            next();
        } catch (error) {
            logger.error('Cache response middleware error', { message: error.message });
            next();
        }
    };
};

module.exports = cacheMiddleware;
module.exports.cacheMiddleware = cacheMiddleware;
module.exports.invalidateCache = invalidateCache;
module.exports.clearCacheByKey = clearCacheByKey;
module.exports.cacheResponse = cacheResponse;
