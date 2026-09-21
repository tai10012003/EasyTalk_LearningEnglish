const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter, getClientIp } = require('../src/shared/middleware/rateLimiter');

function createMockResponse() {
    return {
        headers: {},
        statusCode: 200,
        body: null,
        setHeader(name, value) {
            this.headers[name] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

test('rate limiter falls back to memory when Redis is unavailable', async () => {
    const limiter = createRateLimiter({
        windowMs: 1000,
        max: 2,
        keyPrefix: `unit-${Date.now()}`,
        keyGenerator: () => 'user-1'
    });

    let nextCount = 0;
    const req = { headers: {}, ip: '127.0.0.1' };

    const firstRes = createMockResponse();
    await limiter(req, firstRes, () => { nextCount += 1; });
    assert.equal(firstRes.headers['X-RateLimit-Remaining'], '1');

    const secondRes = createMockResponse();
    await limiter(req, secondRes, () => { nextCount += 1; });
    assert.equal(secondRes.headers['X-RateLimit-Remaining'], '0');

    const thirdRes = createMockResponse();
    await limiter(req, thirdRes, () => { nextCount += 1; });
    assert.equal(thirdRes.statusCode, 429);
    assert.equal(thirdRes.body.code, 'RATE_LIMITED');
    assert.equal(nextCount, 2);
});

test('getClientIp uses the first forwarded IP', () => {
    const req = {
        headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.2' },
        ip: '127.0.0.1'
    };

    assert.equal(getClientIp(req), '203.0.113.10');
});
