const verifyToken = require('./verifyToken');
const { verifyAdmin, optionalAuth } = require('./verifyToken');
const cacheMiddleware = require('./cacheMiddleware');
const { invalidateCache, clearCacheByKey, cacheResponse } = require('./cacheMiddleware');
const { AppError, errorHandler, asyncHandler, notFound } = require('./errorHandler');
const responseFormatter = require('./responseFormatter');
let validation = {};
try {
    validation = require('./validation');
} catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
    }
}

const createError = (message, statusCode, code = null) => new AppError(message, statusCode, code);

module.exports = {
    verifyToken,
    verifyAdmin,
    optionalAuth,
    cacheMiddleware,
    invalidateCache,
    clearCacheByKey,
    cacheResponse,
    errorHandler,
    asyncHandler,
    notFound,
    notFoundHandler: notFound,
    AppError,
    createError,
    responseFormatter,
    ...validation
};