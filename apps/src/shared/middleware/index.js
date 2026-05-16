const verifyToken = require('./verifyToken');
const { verifyAdmin, optionalAuth } = require('./verifyToken');
const cacheMiddleware = require('./cacheMiddleware');
const { invalidateCache, clearCacheByKey, cacheResponse } = require('./cacheMiddleware');
const errorHandler = require('./errorHandler');
const { asyncHandler, notFoundHandler, AppError, createError } = require('./errorHandler');
const validation = require('./validation');

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
    notFoundHandler,
    AppError,
    createError,
    ...validation
};