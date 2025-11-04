const { getRedisClient } = require('./redisClient');

const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        const redis = getRedisClient();
        const key = `cache:${req.originalUrl}`;
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                console.log(`Cache hit for ${key}`);
                return res.json(JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('Cache middleware get error:', err);
        }
        const originalJson = res.json;
        res.json = function (data) {
            try {
                redis.setex(key, duration, JSON.stringify(data));
                console.log(`Cache set for ${key} (TTL: ${duration}s)`);
            } catch (err) {
                console.error('Cache middleware set error:', err);
            }
            originalJson.call(this, data);
        };
        next();
    };
};

module.exports = { cacheMiddleware };