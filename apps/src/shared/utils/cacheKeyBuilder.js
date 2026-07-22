const crypto = require('crypto');

const DEFAULT_NAMESPACE = process.env.CACHE_NAMESPACE || 'easytalk';
const DEFAULT_VERSION = process.env.CACHE_VERSION || 'v1';

function normalizeValue(value) {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalizeValue);
    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce((normalized, key) => {
                const current = value[key];
                if (current !== undefined && current !== null && current !== '') {
                    normalized[key] = normalizeValue(current);
                }
                return normalized;
            }, {});
    }
    return value;
}

function stableStringify(value) {
    return JSON.stringify(normalizeValue(value || {}));
}

function hashQuery(query = {}, length = 12) {
    return crypto
        .createHash('sha1')
        .update(stableStringify(query))
        .digest('hex')
        .slice(0, length);
}

function buildCacheKey({ module, resource, id, query, namespace = DEFAULT_NAMESPACE, version = DEFAULT_VERSION }) {
    const parts = [namespace, version, module, resource].filter(Boolean);
    if (id !== undefined && id !== null) {
        parts.push(String(id));
    } else if (query && Object.keys(normalizeValue(query)).length > 0) {
        parts.push(hashQuery(query));
    }
    return parts.join(':');
}

function buildTag(module, resource, id) {
    return [DEFAULT_NAMESPACE, DEFAULT_VERSION, 'tag', module, resource, id].filter(Boolean).join(':');
}

function buildLockKey(key) {
    return [DEFAULT_NAMESPACE, DEFAULT_VERSION, 'lock', hashQuery({ key }, 16)].join(':');
}

module.exports = {
    buildCacheKey,
    buildTag,
    buildLockKey,
    hashQuery,
    stableStringify,
    DEFAULT_NAMESPACE,
    DEFAULT_VERSION
};
