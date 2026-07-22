const crypto = require('crypto');
const { buildLockKey } = require('./cacheKeyBuilder');
const logger = require('./logger');

const DEFAULT_LOCK_TTL_MS = 5000;
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
end
return 0
`;

class CacheLockManager {
    constructor(redis) {
        this.redis = redis;
    }

    async acquire(key, lockTtl = DEFAULT_LOCK_TTL_MS) {
        const lockKey = buildLockKey(key);
        const token = crypto.randomBytes(16).toString('hex');
        const result = await this.redis.set(lockKey, token, 'PX', lockTtl, 'NX');
        if (result !== 'OK') return null;
        return { key: lockKey, token };
    }

    async release(lock) {
        if (!lock?.key || !lock?.token) return false;
        try {
            const released = await this.redis.eval(RELEASE_LOCK_SCRIPT, 1, lock.key, lock.token);
            return released === 1;
        } catch (err) {
            logger.warn('Cache lock release failed', { key: lock.key, message: err.message });
            return false;
        }
    }
}

module.exports = {
    CacheLockManager,
    DEFAULT_LOCK_TTL_MS
};
