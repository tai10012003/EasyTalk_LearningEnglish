const Redis = require('ioredis');

let redisClient;
let isConnected = false;
const getRedisClient = () => {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log(`Connecting to Redis: ${redisUrl}`);
        redisClient = new Redis(redisUrl, {
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            retryStrategy(times) {
                if (times > 10) {
                    console.error('Redis: Reached max retry attempts (10). Giving up.');
                    console.error('Redis: App will run WITHOUT cache functionality');
                    return null;
                }
                const delay = Math.min(times * 100, 3000);
                console.log(`Redis retry attempt ${times}/10, waiting ${delay}ms...`);
                return delay;
            },
            reconnectOnError(err) {
                console.log(`Redis reconnecting due to: ${err.message}`);
                return true;
            },
        });
        redisClient.on('error', (err) => {
            console.error(`Redis Error [${err.code || 'UNKNOWN'}]: ${err.message}`);
            isConnected = false;
        });
        redisClient.on('connect', () => {
            console.log('Redis: Connection established');
            isConnected = false;
        });
        redisClient.on('ready', () => {
            console.log('Redis: Ready to accept commands');
            isConnected = true;
        });
        redisClient.on('close', () => {
            console.log('Redis: Connection closed');
            isConnected = false;
        });
        redisClient.on('reconnecting', () => {
            console.log('Redis: Attempting to reconnect...');
            isConnected = false;
        });
        redisClient.on('end', () => {
            console.log('Redis: Connection ended permanently');
            isConnected = false;
        });
    }
    return redisClient;
};

const isRedisConnected = () => {
    if (!redisClient) return false;
    return isConnected && redisClient.status === 'ready';
};

module.exports = { getRedisClient, isRedisConnected };