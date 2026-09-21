const test = require('node:test');
const assert = require('node:assert/strict');
const { CacheService } = require('../src/shared/utils/cacheService');
const metrics = require('../src/shared/utils/cacheMetrics');
const cacheNs = require('../src/shared/utils/cacheNamespaces');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class FakeRedis {
    constructor({ down = false } = {}) {
        this.down = down;
        this.values = new Map();
        this.sets = new Map();
    }

    isAvailable() {
        return !this.down;
    }

    async get(key) {
        if (this.down) return null;
        return this.values.get(key) ?? null;
    }

    async setex(key, ttl, value) {
        if (this.down) return;
        this.values.set(key, value);
    }

    async set(key, value, ...args) {
        if (this.down) return null;
        const nx = args.includes('NX');
        if (nx && this.values.has(key)) return null;
        this.values.set(key, value);
        return 'OK';
    }

    async unlink(...keys) {
        let deleted = 0;
        for (const key of keys) {
            if (this.values.delete(key)) deleted += 1;
            if (this.sets.delete(key)) deleted += 1;
        }
        return deleted;
    }

    async del(...keys) {
        return await this.unlink(...keys);
    }

    async sadd(key, ...members) {
        const current = this.sets.get(key) || new Set();
        members.forEach(member => current.add(member));
        this.sets.set(key, current);
        return members.length;
    }

    async smembers(key) {
        return [...(this.sets.get(key) || [])];
    }

    async expire() {
        return 1;
    }

    async scan() {
        return ['0', []];
    }

    async eval(script, numberOfKeys, key, token) {
        if (this.values.get(key) !== token) return 0;
        this.values.delete(key);
        return 1;
    }
}

test('cache miss calls fetch once and subsequent hit uses cache', async () => {
    metrics.reset();
    const cache = new CacheService(new FakeRedis());
    let fetchCount = 0;

    const first = await cache.getOrSet('unit:key', { ttl: 60 }, async () => {
        fetchCount += 1;
        return { value: 42 };
    });
    const second = await cache.getOrSet('unit:key', { ttl: 60 }, async () => {
        fetchCount += 1;
        return { value: 99 };
    });

    assert.deepEqual(first, { value: 42 });
    assert.deepEqual(second, { value: 42 });
    assert.equal(fetchCount, 1);
    assert.equal(metrics.snapshot().counters['cache.hit'], 1);
});

test('tag invalidation removes tagged keys', async () => {
    const redis = new FakeRedis();
    const cache = new CacheService(redis);

    await cache.set('unit:key', 60, { value: 'cached' }, { tags: ['tag:unit'] });
    assert.deepEqual(await cache.get('unit:key'), { value: 'cached' });

    const deleted = await cache.invalidateTags(['tag:unit'], 'Unit');
    assert.equal(deleted, 1);
    assert.equal(await cache.get('unit:key'), undefined);
});

test('redis down falls through to fetch result', async () => {
    const cache = new CacheService(new FakeRedis({ down: true }));
    let fetchCount = 0;

    const result = await cache.getOrSet('unit:down', { ttl: 60 }, async () => {
        fetchCount += 1;
        return { from: 'db' };
    });

    assert.deepEqual(result, { from: 'db' });
    assert.equal(fetchCount, 1);
});

test('disabled cache policy bypasses reads and writes', async () => {
    const cache = new CacheService(new FakeRedis());
    let fetchCount = 0;

    const first = await cache.getOrSet('unit:no-cache', { ttl: 0, enabled: false }, async () => {
        fetchCount += 1;
        return { value: fetchCount };
    });
    const second = await cache.getOrSet('unit:no-cache', { ttl: 0, enabled: false }, async () => {
        fetchCount += 1;
        return { value: fetchCount };
    });

    assert.deepEqual(first, { value: 1 });
    assert.deepEqual(second, { value: 2 });
});

test('parse error is treated as cache miss', async () => {
    const redis = new FakeRedis();
    const cache = new CacheService(redis);
    redis.values.set('unit:bad-json', '{bad-json');

    const result = await cache.getOrSet('unit:bad-json', { ttl: 60 }, async () => ({ fresh: true }));

    assert.deepEqual(result, { fresh: true });
});

test('concurrent misses use single-flight and only one fetch wins', async () => {
    const cache = new CacheService(new FakeRedis());
    let fetchCount = 0;

    const fetchFn = async () => {
        fetchCount += 1;
        await delay(50);
        return { shared: true };
    };

    const results = await Promise.all([
        cache.getOrSet('unit:single-flight', { ttl: 60, waitMs: 10, waitAttempts: 20 }, fetchFn),
        cache.getOrSet('unit:single-flight', { ttl: 60, waitMs: 10, waitAttempts: 20 }, fetchFn),
        cache.getOrSet('unit:single-flight', { ttl: 60, waitMs: 10, waitAttempts: 20 }, fetchFn)
    ]);

    assert.deepEqual(results, [{ shared: true }, { shared: true }, { shared: true }]);
    assert.equal(fetchCount, 1);
});

test('cache lock is token-scoped and released after write', async () => {
    const cache = new CacheService(new FakeRedis());
    const firstLock = await cache.acquireLock('unit:lock', 5000);

    assert.ok(firstLock);
    assert.equal(await cache.acquireLock('unit:lock', 5000), null);
    assert.equal(await cache.releaseLock({ ...firstLock, token: 'wrong-token' }), false);
    assert.equal(await cache.acquireLock('unit:lock', 5000), null);
    assert.equal(await cache.releaseLock(firstLock), true);
    assert.ok(await cache.acquireLock('unit:lock', 5000));
});

test('stage dependency invalidation includes journey detail tags', () => {
    const tags = cacheNs.dependencyTags('stage');

    assert.ok(tags.includes(cacheNs.tag('journey', 'details')));
    assert.ok(tags.includes(cacheNs.tag('gate', 'journey')));
});
