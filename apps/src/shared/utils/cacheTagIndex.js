const DEFAULT_TAG_SET_TTL_BUFFER = 86400;

class CacheTagIndex {
    constructor(redis, options = {}) {
        this.redis = redis;
        this.tagSetTtlBuffer = options.tagSetTtlBuffer || DEFAULT_TAG_SET_TTL_BUFFER;
    }

    async register(key, tags = [], ttl = 0) {
        const uniqueTags = [...new Set(tags.filter(Boolean))];
        for (const tag of uniqueTags) {
            await this.redis.sadd(tag, key);
            if (ttl > 0) await this.redis.expire(tag, ttl + this.tagSetTtlBuffer);
        }
    }

    async keysForTag(tag) {
        return await this.redis.smembers(tag);
    }
}

module.exports = {
    CacheTagIndex,
    DEFAULT_TAG_SET_TTL_BUFFER
};
