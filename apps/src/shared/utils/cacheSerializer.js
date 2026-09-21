const DEFAULT_JITTER_RATIO = 0.15;
const MAX_CACHE_PAYLOAD_BYTES = Number(process.env.CACHE_MAX_PAYLOAD_BYTES || 1024 * 1024);

function withJitter(ttl, jitterRatio = DEFAULT_JITTER_RATIO) {
    if (!ttl || ttl <= 0 || jitterRatio <= 0) return ttl;
    return ttl + Math.floor(Math.random() * Math.ceil(ttl * jitterRatio));
}

function createEnvelope(value, ttl, staleTtl = 0) {
    const now = Date.now();
    return {
        __cacheEnvelope: true,
        data: value,
        expiresAt: now + ttl * 1000,
        staleUntil: now + (ttl + staleTtl) * 1000
    };
}

function isEnvelope(value) {
    return value && typeof value === 'object' && value.__cacheEnvelope === true;
}

function serializeCacheValue(value, ttl, options = {}) {
    const {
        staleTtl = 0,
        jitterRatio = DEFAULT_JITTER_RATIO,
        wrap = staleTtl > 0
    } = options;
    const ttlWithJitter = withJitter(ttl, jitterRatio);
    const valueToStore = wrap ? createEnvelope(value, ttl, staleTtl) : value;
    const redisTtl = wrap ? withJitter(ttl + staleTtl, jitterRatio) : ttlWithJitter;
    const serialized = JSON.stringify(valueToStore);

    return {
        serialized,
        redisTtl,
        payloadBytes: Buffer.byteLength(serialized)
    };
}

function parseCacheEntry(serialized) {
    const parsed = JSON.parse(serialized);
    if (!isEnvelope(parsed)) {
        return {
            data: parsed,
            fresh: true,
            stale: false,
            legacy: true
        };
    }
    const now = Date.now();
    return {
        data: parsed.data,
        fresh: parsed.expiresAt > now,
        stale: parsed.expiresAt <= now && parsed.staleUntil > now,
        expired: parsed.staleUntil <= now,
        envelope: parsed
    };
}

module.exports = {
    DEFAULT_JITTER_RATIO,
    MAX_CACHE_PAYLOAD_BYTES,
    parseCacheEntry,
    serializeCacheValue,
    withJitter
};
