const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../../../shared/middleware/verifyToken');
const { asyncHandler } = require('../../../shared/middleware/errorHandler');
const cache = require('../../../shared/utils/cacheService');
const metrics = require('../../../shared/utils/cacheMetrics');
const cacheAdminService = require('../services/cacheAdminService');

let services = {};

function internalOrAdmin(req, res, next) {
    if (cacheAdminService.hasInternalCacheToken(req)) {
        return next();
    }
    return verifyAdmin(req, res, next);
}

async function warmUpSelectedCache(selectedModules = []) {
    return await cacheAdminService.warmUpSelectedCache(services, selectedModules);
}

router.get('/api/metrics', internalOrAdmin, asyncHandler(async (req, res) => {
    res.json({ success: true, metrics: metrics.snapshot() });
}));

router.post('/api/purge', internalOrAdmin, asyncHandler(async (req, res) => {
    const tags = cacheAdminService.purgeTagsForTarget(req.body);
    if (!tags.length) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cache purge target.'
        });
    }
    const deleted = await cache.invalidateTags(tags, 'Manual');
    res.json({ success: true, deleted, tags });
}));

router.post('/api/warm-up', internalOrAdmin, asyncHandler(async (req, res) => {
    const warmed = await warmUpSelectedCache(req.body?.modules || []);
    res.json({ success: true, warmed });
}));

router.post('/api/metrics/reset', internalOrAdmin, asyncHandler(async (req, res) => {
    metrics.reset();
    res.json({ success: true });
}));

module.exports = router;
module.exports.setCacheServices = (nextServices) => {
    services = nextServices || {};
};
module.exports.warmUpSelectedCache = warmUpSelectedCache;
