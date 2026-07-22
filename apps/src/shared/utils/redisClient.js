const Redis = require('ioredis');
const logger = require('./logger');
const metrics = require('./cacheMetrics');

let redisClient;
let isConnected = false;
let connectPromise = null;

const REDIS_COMMAND_TIMEOUT_MS = Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 100);
const CIRCUIT_FAILURE_THRESHOLD = Number(process.env.REDIS_CIRCUIT_FAILURE_THRESHOLD || 5);
const CIRCUIT_OPEN_MS = Number(process.env.REDIS_CIRCUIT_OPEN_MS || 10000);

const circuit = {
    failures: 0,
    openedUntil: 0
};

function buildRedisUrl() {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;
    const host = process.env.REDIS_HOST || (process.env.NODE_ENV === 'production' ? 'redis' : 'localhost');
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : '';
    return `redis://${password}${host}:${port}`;
}

function isRedisEnabled() {
    return process.env.REDIS_ENABLED !== 'false';
}

function isCircuitOpen() {
    return Date.now() < circuit.openedUntil;
}

function recordRedisSuccess() {
    circuit.failures = 0;
    circuit.openedUntil = 0;
}

function recordRedisFailure(command, err) {
    circuit.failures += 1;
    metrics.increment('redis.error');
    metrics.increment(`redis.${command}.error`);
    if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
        circuit.openedUntil = Date.now() + CIRCUIT_OPEN_MS;
        logger.warn('Redis circuit opened', {
            command,
            failures: circuit.failures,
            openMs: CIRCUIT_OPEN_MS,
            reason: err.message
        });
    }
}

function timeoutAfter(ms, command) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Redis ${command} timeout after ${ms}ms`)), ms);
    });
}

async function runRedisCommand(command, fallback, fn) {
    if (!isRedisConnected() || isCircuitOpen()) {
        if (isCircuitOpen()) metrics.increment('redis.circuit.skip');
        return fallback;
    }
    const startedAt = Date.now();
    try {
        const result = await Promise.race([
            fn(getRedisClient()),
            timeoutAfter(REDIS_COMMAND_TIMEOUT_MS, command)
        ]);
        metrics.observe(`redis.${command}.latencyMs`, Date.now() - startedAt);
        recordRedisSuccess();
        return result;
    } catch (err) {
        metrics.observe(`redis.${command}.latencyMs`, Date.now() - startedAt);
        recordRedisFailure(command, err);
        logger.warn('Redis command failed', { command, message: err.message });
        return fallback;
    }
}

const getRedisClient = () => {
    if (!isRedisEnabled()) return null;
    if (!redisClient) {
        const redisUrl = buildRedisUrl();
        logger.info('Connecting to Redis', { url: redisUrl.replace(/:\/\/[^@]+@/, '://***@') });
        redisClient = new Redis(redisUrl, {
            lazyConnect: false,
            maxRetriesPerRequest: 2,
            enableOfflineQueue: false,
            connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000),
            commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
            retryStrategy(times) {
                if (times > 3) return null;
                return Math.min(times * 100, 1000);
            },
            reconnectOnError: () => true,
        });
        redisClient.on('error', (err) => {
            isConnected = false;
            logger.warn('Redis client error', { message: err.message });
        });
        redisClient.on('ready', () => {
            isConnected = true;
            recordRedisSuccess();
        });
        redisClient.on('close', () => { isConnected = false; });
        redisClient.on('end', () => { isConnected = false; });
    }
    return redisClient;
};

const connectRedis = async (timeoutMs = 5000) => {
    if (!isRedisEnabled()) {
        logger.info('Redis disabled by REDIS_ENABLED=false');
        return false;
    }
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

const isRedisConnected = () => isRedisEnabled() && isConnected && redisClient?.status === 'ready' && !isCircuitOpen();

const safeRedisClient = {
    isAvailable() {
        return isRedisConnected();
    },
    async get(key) {
        return await runRedisCommand('get', null, client => client.get(key));
    },
    async setex(key, ttl, value) {
        return await runRedisCommand('setex', undefined, client => client.setex(key, ttl, value));
    },
    async set(key, value, ...args) {
        return await runRedisCommand('set', null, client => client.set(key, value, ...args));
    },
    async del(...args) {
        return await runRedisCommand('del', 0, client => client.del(...args));
    },
    async unlink(...args) {
        return await runRedisCommand('unlink', 0, client => client.unlink(...args));
    },
    async sadd(key, ...members) {
        if (members.length === 0) return 0;
        return await runRedisCommand('sadd', 0, client => client.sadd(key, ...members));
    },
    async smembers(key) {
        return await runRedisCommand('smembers', [], client => client.smembers(key));
    },
    async expire(key, ttl) {
        return await runRedisCommand('expire', 0, client => client.expire(key, ttl));
    },
    async incr(key) {
        return await runRedisCommand('incr', null, client => client.incr(key));
    },
    async pexpire(key, ttlMs) {
        return await runRedisCommand('pexpire', 0, client => client.pexpire(key, ttlMs));
    },
    async pttl(key) {
        return await runRedisCommand('pttl', -1, client => client.pttl(key));
    },
    async scan(cursor, ...args) {
        return await runRedisCommand('scan', ['0', []], client => client.scan(cursor, ...args));
    },
    async keys(pattern) {
        return await runRedisCommand('keys', [], client => client.keys(pattern));
    },
    async eval(script, numberOfKeys, ...args) {
        return await runRedisCommand('eval', 0, client => client.eval(script, numberOfKeys, ...args));
    },
};

const getSafeRedisClient = () => safeRedisClient;

module.exports = {
    getRedisClient,
    getSafeRedisClient,
    connectRedis,
    isRedisConnected,
    isCircuitOpen,
    isRedisEnabled
};
