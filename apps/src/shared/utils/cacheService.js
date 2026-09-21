const { getSafeRedisClient } = require('./redisClient');
const { CacheLockManager, DEFAULT_LOCK_TTL_MS } = require('./cacheLock');
const { CacheTagIndex } = require('./cacheTagIndex');
const {
    DEFAULT_JITTER_RATIO,
    MAX_CACHE_PAYLOAD_BYTES,
    parseCacheEntry,
    serializeCacheValue
} = require('./cacheSerializer');
const logger = require('./logger');
const metrics = require('./cacheMetrics');

const DEFAULT_WAIT_MS = 60;
const DEFAULT_WAIT_ATTEMPTS = 20;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CacheService {
    constructor(redis = getSafeRedisClient()) {
        this.redis = redis;
        this.tagIndex = new CacheTagIndex(redis);
        this.locks = new CacheLockManager(redis);
    }

    async getEntry(key) {
        const cached = await this.redis.get(key);
        if (cached === null || cached === undefined) return undefined;
        try {
            return parseCacheEntry(cached);
        } catch (err) {
            metrics.increment('cache.parse_error');
            logger.warn('Cache parse error', { key, message: err.message });
            return undefined;
        }
    }

    async get(key) {
        const entry = await this.getEntry(key);
        if (!entry) return undefined;
        if (entry.fresh || entry.stale || entry.legacy) return entry.data;
        return undefined;
    }

    async set(key, ttl, value, options = {}) {
        if (value === undefined) return;
        if (!ttl || ttl <= 0) return;
        const { tags = [] } = options;
        try {
            const { serialized, redisTtl, payloadBytes } = serializeCacheValue(value, ttl, options);
            if (payloadBytes > MAX_CACHE_PAYLOAD_BYTES) {
                metrics.increment('cache.payload_skipped');
                logger.warn('Cache payload skipped because it is too large', {
                    key,
                    payloadBytes,
                    maxBytes: MAX_CACHE_PAYLOAD_BYTES
                });
                return;
            }
            await this.redis.setex(key, redisTtl, serialized);
            await this.tagIndex.register(key, tags, redisTtl);
            metrics.increment('cache.set');
        } catch (err) {
            metrics.increment('cache.set_error');
            logger.warn('Cache set error', { key, message: err.message });
        }
    }

    async delete(...keys) {
        const uniqueKeys = [...new Set(keys.filter(Boolean))];
        if (!uniqueKeys.length) return 0;
        return await this.redis.unlink(...uniqueKeys);
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
            metrics.increment('cache.invalidate_count', total);
            if (total > 0) logger.info('Cache invalidated by pattern', { label, total });
            return total;
        } catch (err) {
            metrics.increment('cache.invalidate_error');
            logger.error('Cache pattern invalidation error', { label, message: err.message });
            return 0;
        }
    }

    async invalidateTags(tags, label = 'Cache') {
        try {
            const uniqueTags = [...new Set((tags || []).filter(Boolean))];
            let totalDeleted = 0;
            for (const tag of uniqueTags) {
                const keys = await this.tagIndex.keysForTag(tag);
                if (keys.length > 0) {
                    totalDeleted += await this.delete(...keys);
                }
                await this.delete(tag);
            }
            metrics.increment('cache.invalidate_count', totalDeleted);
            if (totalDeleted > 0) logger.info('Cache invalidated by tags', { label, totalDeleted });
            return totalDeleted;
        } catch (err) {
            metrics.increment('cache.invalidate_error');
            logger.error('Cache tag invalidation error', { label, message: err.message });
            return 0;
        }
    }

    async acquireLock(key, lockTtl = DEFAULT_LOCK_TTL_MS) {
        return await this.locks.acquire(key, lockTtl);
    }

    async releaseLock(lock) {
        return await this.locks.release(lock);
    }

    refreshInBackground(key, ttl, fetchFn, options) {
        this.acquireLock(key, options.lockTtl).then(lock => {
            if (!lock) return;
            return fetchFn()
                .then(value => this.set(key, ttl, value, options))
                .catch(err => logger.warn('Background cache refresh failed', { key, message: err.message }))
                .finally(() => this.releaseLock(lock));
        }).catch(err => logger.warn('Cache refresh lock failed', { key, message: err.message }));
    }

    normalizeGetOrSetOptions(ttlOrOptions) {
        if (typeof ttlOrOptions === 'object') {
            return {
                ttl: ttlOrOptions.ttl ?? 300,
                staleTtl: ttlOrOptions.staleTtl || 0,
                tags: ttlOrOptions.tags || [],
                enabled: ttlOrOptions.enabled !== false,
                lockTtl: ttlOrOptions.lockTtl || DEFAULT_LOCK_TTL_MS,
                waitMs: ttlOrOptions.waitMs || DEFAULT_WAIT_MS,
                waitAttempts: ttlOrOptions.waitAttempts || DEFAULT_WAIT_ATTEMPTS,
                jitterRatio: ttlOrOptions.jitterRatio ?? DEFAULT_JITTER_RATIO,
                wrap: ttlOrOptions.staleTtl > 0
            };
        }
        return {
            ttl: ttlOrOptions || 300,
            staleTtl: 0,
            tags: [],
            enabled: true,
            lockTtl: DEFAULT_LOCK_TTL_MS,
            waitMs: DEFAULT_WAIT_MS,
            waitAttempts: DEFAULT_WAIT_ATTEMPTS,
            jitterRatio: DEFAULT_JITTER_RATIO,
            wrap: false
        };
    }

    async getOrSet(key, ttlOrOptions, fetchFn) {
        const options = this.normalizeGetOrSetOptions(ttlOrOptions);
        if (!options.enabled || options.ttl <= 0) {
            return await fetchFn();
        }
        const cached = await this.getEntry(key);
        if (cached?.fresh || cached?.legacy) {
            metrics.increment('cache.hit');
            return cached.data;
        }
        if (cached?.stale) {
            metrics.increment('cache.hit_stale');
            this.refreshInBackground(key, options.ttl, fetchFn, options);
            return cached.data;
        }

        metrics.increment('cache.miss');
        const lock = await this.acquireLock(key, options.lockTtl);
        if (lock) {
            try {
                const value = await fetchFn();
                await this.set(key, options.ttl, value, options);
                return value;
            } finally {
                await this.releaseLock(lock);
            }
        }
        if (typeof this.redis.isAvailable === 'function' && !this.redis.isAvailable()) {
            metrics.increment('cache.lock_skipped_redis_unavailable');
            const value = await fetchFn();
            await this.set(key, options.ttl, value, options);
            return value;
        }

        const waitStartedAt = Date.now();
        for (let attempt = 0; attempt < options.waitAttempts; attempt += 1) {
            await sleep(options.waitMs);
            const retryCached = await this.getEntry(key);
            if (retryCached?.fresh || retryCached?.stale || retryCached?.legacy) {
                metrics.increment('cache.lock_wait_hit');
                metrics.observe('cache.stampede_lock_wait_ms', Date.now() - waitStartedAt);
                return retryCached.data;
            }
        }

        metrics.increment('cache.lock_wait_timeout');
        metrics.observe('cache.stampede_lock_wait_ms', Date.now() - waitStartedAt);
        const value = await fetchFn();
        await this.set(key, options.ttl, value, options);
        return value;
    }
}

module.exports = new CacheService();
module.exports.CacheService = CacheService;
