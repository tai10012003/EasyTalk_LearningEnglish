const { getSafeRedisClient } = require("../utils/redisClient");

const memoryStore = new Map();

function getClientIp(req) {
    const forwardedFor = req.headers?.["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (forwardedFor || req.ip || req.socket?.remoteAddress || "");
    return String(ip).split(",")[0].trim() || "unknown";
}

function cleanupMemoryStore() {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
        if(record.resetAt <= now) {
            memoryStore.delete(key);
        }
    }
}

async function incrementRedisCounter(key, windowMs) {
    const client = getSafeRedisClient();
    if (!client.isAvailable()) return null;
    const count = await client.incr(key);
    if (count === null || count === undefined) return null;
    if(count === 1) {
        await client.pexpire(key, windowMs);
    }
    const ttl = await client.pttl(key);
    const resetInMs = ttl > 0 ? ttl : windowMs;
    return { count, resetAt: Date.now() + resetInMs };
}

function incrementMemoryCounter(key, windowMs) {
    cleanupMemoryStore();
    const now = Date.now();
    const current = memoryStore.get(key);
    if(!current || current.resetAt <= now) {
        const record = { count: 1, resetAt: now + windowMs };
        memoryStore.set(key, record);
        return record;
    }
    current.count += 1;
    return current;
}

function createRateLimiter({ windowMs, max, keyPrefix, keyGenerator, message }) {
    return async function rateLimit(req, res, next) {
        const keyPart = keyGenerator ? keyGenerator(req) : getClientIp(req);
        const key = `rate-limit:${keyPrefix}:${keyPart}`;
        let record;
        try {
            record = await incrementRedisCounter(key, windowMs);
            if (!record) record = incrementMemoryCounter(key, windowMs);
        } catch (error) {
            console.warn(`[RateLimit] Redis failed, falling back to memory: ${error.message}`);
            record = incrementMemoryCounter(key, windowMs);
        }
        res.setHeader("X-RateLimit-Limit", String(max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(max - record.count, 0)));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));
        if(record.count > max) {
            return res.status(429).json({
                success: false,
                message: message || "Too many requests. Please try again later.",
                code: "RATE_LIMITED"
            });
        }
        next();
    };
}

module.exports = {
    createRateLimiter,
    getClientIp
};
