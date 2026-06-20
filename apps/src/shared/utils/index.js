const socket = require('./socket');
const dateFormat = require('./dateFormat');
const redisClient = require('./redisClient');
const emailSender = require('./emailSender');
const learningProgression = require('./learningProgression');
const cacheService = require('./cacheService');

module.exports = {
    ...socket,
    ...dateFormat,
    ...redisClient,
    ...emailSender,
    ...learningProgression,
    cacheService
};