const Redis = require('ioredis');

let redisClient;
let isConnected = false;
let connectPromise = null;
const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log(`Connecting to Redis: ${redisUrl}`);
        redisClient = new Redis(redisUrl, {
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            retryStrategy(times) {
                if (times > 3) return null;
                return Math.min(times * 100, 1000);
            },
            reconnectOnError: () => true,
        });
        redisClient.on('error', (err) => {
            isConnected = false;
        });
        redisClient.on('connect', () => {});
        redisClient.on('ready', () => {
            isConnected = true;
        });
        redisClient.on('close', () => {
            isConnected = false;
        });
        redisClient.on('reconnecting', () => {});
        redisClient.on('end', () => {
            isConnected = false;
        });
    }
    return redisClient;
};

const connectRedis = async (timeoutMs = 5000) => {
    if (connectPromise) return connectPromise;
    connectPromise = Promise.race([
        new Promise((resolve) => {
            const client = getRedisClient();
            client.once('ready', () => resolve(true));
        }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connect timeout')), timeoutMs)
        ),
    ]).finally(() => {
        connectPromise = null;
    });
    return connectPromise;
};

const isRedisConnected = () => isConnected && redisClient?.status === 'ready';

module.exports = { getRedisClient, connectRedis, isRedisConnected };