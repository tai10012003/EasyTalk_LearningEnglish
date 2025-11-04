const { getRedisClient, isRedisConnected } = require('./redisClient');

const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        if (!isRedisConnected()) {
            return next();
        }
        const redis = getRedisClient();
        const key = `cache:${req.originalUrl}`;
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                console.log(`Cache HIT: ${key}`);
                return res.json(JSON.parse(cachedData));
            }
            console.log(`Cache MISS: ${key}`);
        } catch (err) {
            console.error(`Cache GET failed for ${key}: ${err.message}`);
        }
        const originalJson = res.json;
        res.json = function (data) {
            if (isRedisConnected()) {
                redis.setex(key, duration, JSON.stringify(data))
                    .then(() => console.log(`Cache SET: ${key} (TTL: ${duration}s)`))
                    .catch(err => console.error(`Cache SET failed for ${key}: ${err.message}`));
            }
            originalJson.call(this, data);
        };
        next();
    };
};

module.exports = { cacheMiddleware };