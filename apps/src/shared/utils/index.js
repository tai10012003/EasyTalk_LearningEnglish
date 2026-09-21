const socket = require('./socket');
const dateFormat = require('./dateFormat');
const redisClient = require('./redisClient');
const emailSender = require('./emailSender');
const learningProgression = require('./learningProgression');
const cacheService = require('./cacheService');
const cacheKeyBuilder = require('./cacheKeyBuilder');
const cacheNamespaces = require('./cacheNamespaces');
const cachePolicies = require('./cachePolicies');
const logger = require('./logger');
const cacheMetrics = require('./cacheMetrics');
const cacheSerializer = require('./cacheSerializer');
const cacheLock = require('./cacheLock');
const cacheTagIndex = require('./cacheTagIndex');

module.exports = {
    ...socket,
    ...dateFormat,
    ...redisClient,
    ...emailSender,
    ...learningProgression,
    cacheService,
    cacheKeyBuilder,
    cacheNamespaces,
    cachePolicies,
    logger,
    cacheMetrics,
    cacheSerializer,
    cacheLock,
    cacheTagIndex
};
