const counters = new Map();
const timings = new Map();

function increment(name, value = 1) {
    counters.set(name, (counters.get(name) || 0) + value);
}

function observe(name, durationMs) {
    const current = timings.get(name) || {
        count: 0,
        totalMs: 0,
        minMs: Number.POSITIVE_INFINITY,
        maxMs: 0
    };
    current.count += 1;
    current.totalMs += durationMs;
    current.minMs = Math.min(current.minMs, durationMs);
    current.maxMs = Math.max(current.maxMs, durationMs);
    timings.set(name, current);
}

function snapshot() {
    const timingSnapshot = {};
    for (const [name, timing] of timings.entries()) {
        timingSnapshot[name] = {
            count: timing.count,
            avgMs: timing.count ? Number((timing.totalMs / timing.count).toFixed(2)) : 0,
            minMs: Number.isFinite(timing.minMs) ? Number(timing.minMs.toFixed(2)) : 0,
            maxMs: Number(timing.maxMs.toFixed(2))
        };
    }

    const counterSnapshot = Object.fromEntries(counters.entries());
    const hits = counterSnapshot['cache.hit'] || 0;
    const misses = counterSnapshot['cache.miss'] || 0;
    const totalReads = hits + misses;

    return {
        counters: counterSnapshot,
        timings: timingSnapshot,
        rates: {
            hitRate: totalReads ? Number((hits / totalReads).toFixed(4)) : 0,
            missRate: totalReads ? Number((misses / totalReads).toFixed(4)) : 0
        }
    };
}

function reset() {
    counters.clear();
    timings.clear();
}

module.exports = {
    increment,
    observe,
    snapshot,
    reset
};
