const { getRedisClient, isRedisConnected } = require('./redisClient');

const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        if (!isRedisConnected()) {
            return next();
        }
        const redis = getRedisClient();
        const userId = req.user?.id || "";
        const key = `cache:${userId}:${req.originalUrl}`;
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`Cache HIT: ${key}`);
                }
                return res.json(JSON.parse(cachedData));
            }
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Cache MISS: ${key}`);
            }
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(`Cache GET failed: ${err.message}`);
            }
        }
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (isRedisConnected()) {
                redis.setex(key, duration, JSON.stringify(data)).catch(() => {});
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`Cache SET: ${key} (TTL: ${duration}s)`);
                }
            }
            return originalJson(data);
        };
        next();
    };
};

module.exports = { cacheMiddleware };