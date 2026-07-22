const test = require('node:test');
const assert = require('node:assert/strict');
const cacheAdminService = require('../src/modules/cache/services/cacheAdminService');

test('cache admin token comparison accepts matching token only', () => {
    assert.equal(cacheAdminService.timingSafeTokenEqual('secret-token', 'secret-token'), true);
    assert.equal(cacheAdminService.timingSafeTokenEqual('secret-token', 'wrong-token'), false);
    assert.equal(cacheAdminService.timingSafeTokenEqual('secret-token', ''), false);
});

test('cache purge target builds module tags', () => {
    const tags = cacheAdminService.purgeTagsForTarget({ module: 'grammar' });

    assert.ok(tags.includes('easytalk:v1:tag:grammar:all'));
    assert.ok(tags.includes('easytalk:v1:tag:grammar:list'));
    assert.ok(tags.includes('easytalk:v1:tag:grammar:item'));
});

test('cache purge target rejects unknown module', () => {
    assert.deepEqual(cacheAdminService.purgeTagsForTarget({ module: 'unknown' }), []);
});
