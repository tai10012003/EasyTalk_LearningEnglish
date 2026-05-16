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
        redisClient.on('error', () => { isConnected = false; });
        redisClient.on('connect', () => {});
        redisClient.on('ready', () => { isConnected = true; });
        redisClient.on('close', () => { isConnected = false; });
        redisClient.on('reconnecting', () => {});
        redisClient.on('end', () => { isConnected = false; });
    }
    return redisClient;
};

// Fix: clean up the 'ready' listener when the timeout fires to prevent a memory leak.
const connectRedis = async (timeoutMs = 5000) => {
    if (connectPromise) return connectPromise;
    connectPromise = new Promise((resolve, reject) => {
        const client = getRedisClient();
        const onReady = () => { clearTimeout(timer); resolve(true); };
        const timer = setTimeout(() => {
            client.off('ready', onReady);
            reject(new Error('Redis connect timeout'));
        }, timeoutMs);
        client.once('ready', onReady);
    }).finally(() => {
        connectPromise = null;
    });
    return connectPromise;
};

const isRedisConnected = () => isConnected && redisClient?.status === 'ready';

// Safe wrapper: every method returns a safe default instead of throwing when Redis is
// unavailable. Use getSafeRedisClient() in services and cache helpers so that a Redis
// outage never surfaces as an application error — the caller falls through to MongoDB.
const safeRedisClient = {
    async get(key) {
        if (!isRedisConnected()) return null;
        try { return await getRedisClient().get(key); }
        catch (err) { console.warn(`[Redis] get "${key}" failed: ${err.message}`); return null; }
    },
    async setex(key, ttl, value) {
        if (!isRedisConnected()) return;
        try { await getRedisClient().setex(key, ttl, value); }
        catch (err) { console.warn(`[Redis] setex "${key}" failed: ${err.message}`); }
    },
    async del(...args) {
        if (!isRedisConnected()) return 0;
        try { return await getRedisClient().del(...args); }
        catch (err) { console.warn(`[Redis] del failed: ${err.message}`); return 0; }
    },
    async scan(cursor, ...args) {
        if (!isRedisConnected()) return ['0', []];
        try { return await getRedisClient().scan(cursor, ...args); }
        catch (err) { console.warn(`[Redis] scan failed: ${err.message}`); return ['0', []]; }
    },
    async keys(pattern) {
        if (!isRedisConnected()) return [];
        try { return await getRedisClient().keys(pattern); }
        catch (err) { console.warn(`[Redis] keys "${pattern}" failed: ${err.message}`); return []; }
    },
};

const getSafeRedisClient = () => safeRedisClient;

module.exports = { getRedisClient, getSafeRedisClient, connectRedis, isRedisConnected };